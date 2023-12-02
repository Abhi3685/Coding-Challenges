/* =============================================
* A simple web server
* Compile: g++ -o server server.cpp -lws2_32
* Run: server.exe
* Open browser and go to http://localhost:8080
============================================= */

#include <bits/stdc++.h>
#include <WinSock2.h> // for socket functions
using namespace std;

#pragma comment(lib, "ws2_32.lib") // link winsock library

#define BUFFERSIZE 30720 // 30KB
#define MAXCLIENTS 20

// helper function to handle client requests concurrently
void handleConnection(SOCKET socket)
{
    thread::id threadId = this_thread::get_id();
    cout << threadId << ": Socket connection established." << endl;
    this_thread::sleep_for(1s); // To verify that the server is handling multiple requests concurrently

    // Receive data from client side
    char buffer[BUFFERSIZE] = { 0 };
    int bytes = recv(socket, buffer, sizeof(buffer), 0);
    if (bytes == 0) {
        cout << threadId << ": Connection closed." << endl;
        return;
    } else if (bytes == SOCKET_ERROR) {
        cout << threadId << ": Receive failed with error code " << WSAGetLastError() << endl;
        return;
    }

    // Read from buffer to figure out request method and path
    stringstream ss(buffer);
    string method = "", path = "";
    ss >> method; ss >> path;

    if (method.compare("GET") != 0) {
        cout << threadId << ": Invalid request method." << endl;
        return;
    }

    cout << threadId << ": Requested path: " << path << endl;
    if (path.compare("/") == 0) path = "/index.html";

    // Read file content to parse it in response
    string fileContent = "";
    ifstream stream("www/" + path);
    if (stream) {
        string line = "";
        while (getline(stream, line)) {
            fileContent += line;
        }
    }

    // Send response to client side
    string serverMessage = "";
    if (fileContent.empty()) serverMessage = "HTTP/1.1 404 Not Found\r\n";
    else serverMessage = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n" + fileContent + "\r\n";

    int bytesSent = 0, totalBytesSent = 0;
    int remainingBytes = serverMessage.length();
    while (totalBytesSent < serverMessage.length())
    {
        bytesSent = send(socket, serverMessage.c_str() + totalBytesSent, remainingBytes, 0);
        if (bytesSent < 0) {
            cout << threadId << ": Send failed with error code : " << WSAGetLastError() << endl;
            return;
        }

        totalBytesSent += bytesSent;
        remainingBytes -= bytesSent;
    }
    
    cout << threadId << ": Response sent. Total bytes: " << totalBytesSent << endl;
    closesocket(socket);
}

// driver function to create a server & handle client requests
int main (int argc, char *argv[])
{
    WSADATA wsaData;

    /* WSAStartup function initiates the use of the Windows Sockets DLL by a process.
    The WSAStartup function returns a pointer to the WSADATA structure taken as parameter. */
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
        cout << "Unable to find Windows Sockets DLL. Error Code: " << WSAGetLastError() << endl;
        return 1;
    }

    // Create a socket that is bound to a specific transport service provider
    SOCKET wsocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (wsocket == INVALID_SOCKET) {
        cout << "Could not create socket. Error code: " << WSAGetLastError() << endl;
        return 1;
    }
    
    // Bind socket to an IP address and port
    struct sockaddr_in server {};
    server.sin_family = AF_INET;
    server.sin_addr.s_addr = inet_addr("127.0.0.1");
    server.sin_port = htons(8080);
    int server_len = sizeof(server);

    if (bind(wsocket, (SOCKADDR*)&server, server_len) != 0) {
        cout << "Bind failed with error code: " << WSAGetLastError() << endl;
        return 1;
    }

    // Listen for incoming connection requests on the created socket
    if (listen(wsocket, MAXCLIENTS) != 0) {
        cout << "Listen failed with error code : " << WSAGetLastError() << endl;
        return 1;
    }

    cout << "Server created successfully." << endl;

    vector<thread*> threads;

    while (true)
    {
        // Keep accepting new connections
        SOCKET new_wsocket = accept(wsocket, (SOCKADDR*)&server, &server_len);
        if (new_wsocket == INVALID_SOCKET) {
            cout << "Accept failed with error code: " << WSAGetLastError() << endl;
            return 1;
        }

        // Handle each connection in a separate thread
        threads.push_back(new thread(handleConnection, new_wsocket));
    }

    // Wait for all threads to finish
    for (auto t : threads) t->join();
    closesocket(wsocket);

    WSACleanup(); // Terminates the use of the Windows Sockets DLL

    return 0;
}
