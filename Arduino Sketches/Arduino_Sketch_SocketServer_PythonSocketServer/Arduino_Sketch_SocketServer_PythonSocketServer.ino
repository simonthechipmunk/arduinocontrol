/*
 
 arduinocontrol@simonthechipmunk.noreply.com
 Arduino example program to work with the Arduino-Control Gnome3-Extension and the python Socket Server via Serial

 format for incoming and outgoing data is: 'actor:value'
 actor = pin to control
 value = value to set the respective output to (e.g. 0-255 or 0/1)
  
*/




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


boolean readComplete = false;   // control bit




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
  
  // the Serial Connection
  Serial.begin(9600);

}





//*** main loop ***

void loop() {
  // set current timestamp
  currentsysTime = millis();


  // convert incoming data and split it into "actor" and "value"
  while (Serial.available() > 0 && readComplete == false) {
     // read the bytes incoming from the client:
     char inChar = (char)Serial.read();
      
     if(inChar == 10)
        // stop reading if NewLine is sent (ASCII 10, '\n' or ctrl-J)
     { 
        int index = inputString.indexOf(separator);           // get index of separator char
        inputInt = (inputString.substring(index+1)).toInt();  // convert value after ":" to int
        inputActor = inputString.substring(0,index);          // store string before ":" into inputString
         
        readComplete = true; // set the command conversion to completed
      

     }
     else 
     {
       inputString += inChar; // add the next inChar to the string (concat)
     }
    
  }
      

  if (readComplete == true) {
    
    // set the outputs according to incoming data
    boolean result = ControlOutput(inputActor, inputInt);

 
    // throw error in case ControlOutput returned 'false'
    if (!result) {
      Serial.println(errorString);
    }

    // set the device to wait for serial input again
    readComplete = false;
    // reset the inputString
    inputString = "";
      
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
        
        
     // send string to Serial
     Serial.println(sendStr);
                
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
        
        // send string to Serial
        Serial.println(sendStr);
                         
      }
      
  }
      
     

     
}
