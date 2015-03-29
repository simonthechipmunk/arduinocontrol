# Simple TCP socket server for the Gnome3 Arduino Control extension
# I took most of the code from the following tutorials/examples on python socket servers and changed it to my needs:
# http://www.binarytides.com/code-chat-application-server-client-sockets-python/
# http://pyserial.sourceforge.net/examples.html#multi-port-tcp-ip-serial-bridge-rfc-2217

# Server bahaviour: Any message received from a connected client is redirected to the Arduino. Any line sent from the Arduino is sent to all connected clients.
#
# Set up your Server IP/Port and the Arduino Serial Port in _main_
# Set IP to 127.0.0.1 for a local Server or set it to your Computer's IP to make the server available on the network
#
# dependencies: python 2.6, pyserial
 
import socket, select, serial, sys


 
#Function to broadcast messages to all connected clients
def broadcast_data (message):
    #Do not send the message to master socket and the arduino
    for socket in CONNECTION_LIST:
        if socket != server_socket and socket != arduino_read:
            try :
                socket.send(message)
            except :
                # broken socket connection may be, chat client quit with ctrl+c for example
                CONNECTION_LIST.remove(socket)
		print "Client (%s, %s) has been removed from the socket list" % addr
		socket.close()



if __name__ == "__main__":

    # check for arguments
    if(len(sys.argv) < 4) :
        print 'Usage : python arduino_socketserver.py hostname port /dev/ttyXX'
        sys.exit()

    # get IP, Port and Device arguments
    HOST = sys.argv[1]
    PORT = int(sys.argv[2])
    DEV = sys.argv[3]
     
    # constants
    CONNECTION_LIST = [] # List to keep track of socket descriptors
    RECV_BUFFER = 1024 # Advisable to keep it as an exponent of 2

    # init serial
    arduino = serial.Serial(DEV,9600,timeout=1)
    arduino_read = arduino.fileno() # wrapper to set serial as readable output in CONNECTION_LIST
    
    # init server
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    # this has no effect, why ?
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_socket.bind((HOST, PORT))
    server_socket.listen(10)
    
 
    # Add server socket and arduino to the list of readable connections
    CONNECTION_LIST.append(server_socket)
    CONNECTION_LIST.append(arduino_read)
 
    print "Arduino server started on port " + str(PORT) + " IP: " + str(HOST)
 
    while 1:
        # Get the list of sockets which are ready to be read through select
        read_sockets,write_sockets,error_sockets = select.select(CONNECTION_LIST,[],[])

 	# test sockets
        for sock in read_sockets:

            #New connection
            if sock == server_socket:
                # Handle the case in which there is a new connection recieved through server_socket
                sockfd, addr = server_socket.accept() # accept conection
                CONNECTION_LIST.append(sockfd)	      # add client to the connection list
                print "Client (%s, %s) connected" % addr


	    #Incoming data from Arduino
	    elif sock == arduino_read:
		try:
	    	    data = arduino.readline()
            	    if data:
		    	arduino.flush()
                    	broadcast_data("" + data)

                except:
                    print "Failed to read from Serial"
                    continue



	    #Some incoming message from a client
            else:
                # Data recieved from client, process it
                try:
                    #In Windows, sometimes when a TCP program closes abruptly,
                    # a "Connection reset by peer" exception will be thrown
                    data = sock.recv(RECV_BUFFER)
                    if data:
			arduino.write(data)
			arduino.flush()             
                 
                except:
		    # broken socket connection may be, chat client quit with ctrl+c for example.
		    # Socket will be removed with next send attempt.
                    print "Client (%s, %s) is offline and will be removed from the list" % addr
                    continue


    server_socket.close()



