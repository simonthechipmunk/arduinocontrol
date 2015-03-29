/*
 Advanced Chat Server

 A simple server that distributes any incoming messages to all
 connected clients but the client the message comes from.
 To use telnet to  your device's IP address and type.
 You can see the client's input in the serial monitor as well.
 Using an Arduino Wiznet Ethernet shield.

 Circuit:
 * Ethernet shield attached to pins 10, 11, 12, 13
 * Analog inputs attached to pins A0 through A5 (optional)

 created 18 Dec 2009
 by David A. Mellis
 modified 9 Apr 2012
 by Tom Igoe
 redesigned to make use of operator== 25 Nov 2013
 by Norbert Truchsess
 adapted to use as a Server for "Arduino Control" Gnome3 Extension  7 Nov 2014
 by Simon Junga
 
 //--//
 
 arduinocontrol@simonthechipmunk.noreply.com
 Arduino example programm to work with the Arduino-Control Gnome3-Extension and serve as Server
 You need to connect an ethernet Shield to Arduino for this to work (e.g enc28J60) and import the UIPethernet
 library by Norbert Truchsess into your Arduino IDE.

 format for incoming and outgoing data is: 'actor:value'
 actor = pin to control
 value = value to set the respective output to (e.g. 0-255 or 0/1)
 

 */

// uncomment for enc28j60 Ethernet Controllers
#include <UIPEthernet.h>

// uncomment for w5100 Ethernet Controllers (Arduino Ethernet Shield)
//#include <SPI.h>
//#include <Ethernet.h>


// Enter a MAC address and IP address for your controller below.
// The IP address will be dependent on your local network.

byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED };
IPAddress ip(192,168,178,60);


// Server Port (telnet defaults to port 23)
EthernetServer server(21567);


// set the maximum amount of connected client sockets
const int maxclients = 4;
EthernetClient clients[maxclients];


// table of controlled pins and their configuration (index of descriptor, actor and according pin number have to match)
const int controlledpins = 4;

String descriptors[controlledpins] = { "digitalOut", "analogOut", "analogIn", "digitalIn" };
String actors[controlledpins] = { "out2", "out3", "sense0", "in4" }; 
int    pins[controlledpins] = { 2, 3, 0, 4 };

int    currentvalues[controlledpins];
int    formervalues[controlledpins];


// constants and server variables
String errorString = "error:nomatch";   // line that is sent to the clients in case of an error
String inputString = "";                // a string to hold the incoming line of data
String inputActor;                      // a string to hold the actor name
int inputInt;                           // an int to hold actor values
String separator = ":";                 // data separator char 

unsigned long currentsysTime = 0;       // current system time for heartbeat interval
unsigned long lastheartTimestamp;       // last run timestamp of heartbeat
unsigned long lastchangeTimestamp;      // last run timestamp of sendOnchange
int heartInterval = 5000;               // heartbeat Interval in ms




//*** setup ***


void setup() {
  
  // set pinMode for pins specified in pins[] according to their configuration in descriptor[]
  for (byte i=0; i<controlledpins; i++) {

    // set pinMode and fill currentvalues[] with data 
    if (descriptors[i] == "digitalOut") {
      pinMode(pins[i], OUTPUT);
      currentvalues[i] = digitalRead(pins[i]);
    }
    
    else if(descriptors[i] == "digitalIn") {
      pinMode(pins[i],INPUT);
      currentvalues[i] = digitalRead(pins[i]);
    }
        
    else if(descriptors[i] == "analogIn") {
      currentvalues[i] = analogRead(pins[i]);
    }
      
    else if(descriptors[i] == "analogOut") {
      pinMode(pins[i],OUTPUT);
      currentvalues[i] = 0;
    }
  
  }
  
  // initialize the ethernet device
  Ethernet.begin(mac, ip);
  // start listening for clients
  server.begin();

}





//*** main loop ***

void loop() {
  // set current timestamp
  currentsysTime = millis();
  // wait for a new client:
  EthernetClient client = server.available();

  if (client) {

    boolean newClient = true;
    for (byte i=0;i<maxclients;i++) {
      //check whether this client refers to the same socket as one of the existing instances:
      if (clients[i]==client) {
        newClient = false;
        break;
      }
    }

    if (newClient) {
      //check which of the existing clients can be overridden:
      for (byte i=0;i<maxclients;i++) {
        if (!clients[i] && clients[i]!=client) {
          clients[i] = client;
          // clear out the input buffer:
//          client.flush();
          break;
        }
      }
    }


    // convert incoming data and split it into "actor" and "value"
    while (client.available() > 0) {
      // read the bytes incoming from the client:
      char inChar = (char)client.read();
      
      if(inChar == 10)
          // stop reading if NewLine is sent (ASCII 10, '\n' or ctrl-J)
      { 
         int index = inputString.indexOf(separator);           // get index of separator char
         inputInt = (inputString.substring(index+1)).toInt();  // convert value after ":" to int
         inputActor = inputString.substring(0,index);          // store string before ":" into inputString
      

       }
      else 
       {
         inputString += inChar; // add the next inChar to the string (concat)
       }
    
    }
      
    
    // set the outputs according to incoming data
    boolean result = ControlOutput(inputActor, inputInt);

 
    // throw error in case ControlOutput returned 'false'
    for (byte i=0;i<maxclients;i++) {
      if (clients[i] && !result) {
        clients[i].println(errorString);
      }
    }

      
  }
  
  
  // reset the inputString
  inputString = "";
  
  
  // remove inactive clients from the client list
  for (byte i=0;i<maxclients;i++) {
    if (!(clients[i].connected())) {
      // client.stop() invalidates the internal socket-descriptor, so next use of == will allways return false;
      clients[i].stop();
    }
  }

  
  // get sensor and input updates every main programm cycle 
  for (byte i=0;i<controlledpins;i++) { 
         
    if(descriptors[i] == "digitalIn") {
      currentvalues[i] = digitalRead(pins[i]);
    }
          
    else if(descriptors[i] == "analogIn") {
      currentvalues[i] = analogRead(pins[i]);
    }    
  }
  
  
  
  // initialize heartbeat/sendOnchange and work around variable rollover ("50 days bug")
  if(((currentsysTime - lastheartTimestamp) > heartInterval) && (currentsysTime < 4294967000))
  {
    sendHeartbeat();
    lastheartTimestamp = currentsysTime;
  }
  
  else if(((currentsysTime - lastchangeTimestamp) > 300) && (currentsysTime < 4294967000))
  {
    sendOnchange();
    lastchangeTimestamp = currentsysTime;
  }
  
  else if(currentsysTime > 4294967000)
  {
    lastheartTimestamp = 0;
    lastchangeTimestamp = 0;
  }
  
  
  
}



//*** functions ***


// set Outputs according to received data, returns true on success; false on error
boolean ControlOutput(String actor, int value)
{
  
  // handle case of new client connection
  if(actor == "client") {
    //sync data to new client immediately
    sendHeartbeat();
    return true;
  }
  
  
  // get array index of pin to control
  int aryindex = -1;
  for (byte i=0; i<controlledpins; i++) {
     if (actor == actors[i]) {
       aryindex = i;
       break;
     }
  }

  if(aryindex == -1) {
    return false;
  }

  // save current value of selected pin
  currentvalues[aryindex] = value;
  
  // control outputs  
  if (descriptors[aryindex] == "digitalOut") {
    digitalWrite(pins[aryindex],value);
    return true;
  }
      
  else if(descriptors[aryindex] == "analogOut") {
    analogWrite(pins[aryindex],value);
    return true;
  }
  
  else {
    // nothing to do
    return true;
  }
  
                
    
}





// send heartbeat (All Sensor/Actor states) to the clients
void sendHeartbeat()
{
  
  
  for (byte e=0;e<controlledpins;e++) {
    
    
     // create string to send        
     String sendStr;  
     sendStr += actors[e];
     sendStr += separator;
     sendStr += currentvalues[e];    
        
        
     // send string to all connected clients
     for (byte i=0;i<maxclients;i++) { 
         if (clients[i]) {
           clients[i].println(sendStr);
         }
       
     }
    
  }

 
 
 
}





//send Onchange (Only Sensor/Actor states that have changed) to the clients
void sendOnchange()
{
  
  // check for changes
  for (byte i=0;i<controlledpins;i++) { 
      if (currentvalues[i] != formervalues[i]) {
     
        // create string to send        
        String sendStr;  
        sendStr += actors[i];
        sendStr += separator;
        sendStr += currentvalues[i]; 
       
        
        formervalues[i] = currentvalues[i];
       
        for (byte e=0;e<maxclients;e++) { 
           if (clients[e]) {
             clients[e].println(sendStr);
           }
    
    
        } 
      
      }
      
  }
      
     

     
}
