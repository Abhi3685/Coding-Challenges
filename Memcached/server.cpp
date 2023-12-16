/* =============================================
* A Simple Memcached Server
* Compile: g++ -o ccmemcached server.cpp -lws2_32
* Run Server: ccmemcached.exe -p 11211
* Client Request: telnet
  > open localhost 11211
============================================= */

#include <bits/stdc++.h>
#include <WinSock2.h> // for socket functions
using namespace std;

#pragma comment(lib, "ws2_32.lib") // link winsock library
#define MAXCLIENTS 20

struct CacheEntry
{
    string data;
    int flags;
    int exptime;
};

unordered_map<string, CacheEntry> cache; // key-value cache
std::mutex cacheMutex; // mutex to synchronize access to cache

// helper function to send response to telnet client
void sendResponse(SOCKET socket, thread::id threadId, const string &response)
{
    int bytesSent = 0, totalBytesSent = 0;
    int remainingBytes = response.length();

    while (totalBytesSent < response.length())
    {
        bytesSent = send(socket, response.c_str() + totalBytesSent, remainingBytes, 0);
        if (bytesSent < 0)
        {
            cout << threadId << ": Send failed with error code : " << WSAGetLastError() << endl;
            return;
        }

        totalBytesSent += bytesSent;
        remainingBytes -= bytesSent;
    }

    cout << threadId << ": Response sent. Total bytes: " << totalBytesSent << endl;
}

// helper function to read command from telnet client (until enter '\r\n' is pressed)
string readCommandString(SOCKET socket, thread::id threadId)
{
    string command = "";
    char prev = '\0', c = '\0';

    while (true)
    {
        int bytes = recv(socket, &c, 1, 0);
        if (bytes == 0)
        {
            cout << threadId << ": Connection closed." << endl;
            return command;
        }
        else if (bytes == SOCKET_ERROR)
        {
            cout << threadId << ": Receive failed with error code " << WSAGetLastError() << endl;
            return command;
        }

        if (prev == '\r' && c == '\n')
            break;
        if (c != '\r')
            command += c;
        prev = c;
    }

    return command;
}

// helper function to handle client requests concurrently
void handleConnection(SOCKET socket)
{
    thread::id threadId = this_thread::get_id();
    cout << threadId << ": Socket connection established." << endl;
    sendResponse(socket, threadId, "Welcome to ccMemcached!\r\n");

    while (true)
    {
        // Read input command from telnet client
        string command = readCommandString(socket, threadId);
        cout << threadId << ": Command received: " << command << endl;

        // Parse command
        stringstream ss(command);
        string operation = "", key = "";
        ss >> operation >> key;

        if (strcmp(operation.c_str(), "get") == 0)
        {
            // handle key doesn't exist in cache
            if (cache.find(key) == cache.end())
            {
                sendResponse(socket, threadId, "END\r\n");
                continue;
            }

            CacheEntry entry = cache[key];

            // handle expired key
            if (entry.exptime != 0 && entry.exptime < time(NULL))
            {
                cache.erase(key);
                sendResponse(socket, threadId, "END\r\n");
                continue;
            }

            // read key and send data to client
            string response = "VALUE " + key + " " + to_string(entry.flags) + " " + to_string(entry.data.length());
            response += "\r\n" + entry.data + "\r\nEND\r\n";

            sendResponse(socket, threadId, response);
            continue;
        }
        
        if (strcmp(operation.c_str(), "set") == 0 ||
            strcmp(operation.c_str(), "add") == 0 ||
            strcmp(operation.c_str(), "replace") == 0 ||
            strcmp(operation.c_str(), "append") == 0 ||
            strcmp(operation.c_str(), "prepend") == 0)
        {
            string flags = "", exptime = "", bytes = "";
            ss >> flags >> exptime >> bytes;

            string data = readCommandString(socket, threadId);
            cout << threadId << ": Data received: " << data << endl;

            if (data.length() != stoi(bytes))
            {
                cout << threadId << ": Data length mismatch." << endl;
                return;
            }

            // handle key already exists in cache
            if (strcmp(operation.c_str(), "add") == 0 && cache.find(key) != cache.end())
            {
                cout << threadId << ": Key already exists in cache." << endl;
                sendResponse(socket, threadId, "NOT_STORED\r\n");
                continue;
            }

            // handle key doesn't exist in cache
            if ((strcmp(operation.c_str(), "replace") == 0 ||
                strcmp(operation.c_str(), "append") == 0 ||
                strcmp(operation.c_str(), "prepend") == 0)
                && cache.find(key) == cache.end())
            {
                cout << threadId << ": Key doesn't exist in cache." << endl;
                sendResponse(socket, threadId, "NOT_STORED\r\n");
                continue;
            }
            
            int exptimeInt = stoi(exptime);
            if (exptimeInt > 0)
                exptimeInt = time(NULL) + exptimeInt;

            CacheEntry entry = {data, stoi(flags), exptimeInt};

            if (strcmp(operation.c_str(), "append") == 0)
                entry.data = cache[key].data + data;
            else if (strcmp(operation.c_str(), "prepend") == 0)
                entry.data = data + cache[key].data;

            std::lock_guard<std::mutex> guard(cacheMutex);

            cache[key] = entry;
            cout << threadId << ": Key-value pair inserted in cache." << endl;

            sendResponse(socket, threadId, "STORED\r\n");
            continue;
        }
        
        cout << threadId << ": Invalid operation specified - " << operation << endl;
        closesocket(socket);
        return;
    }
}

// driver function to create a server & handle client requests
int main(int argc, char *argv[])
{
    WSADATA wsaData;

    /* WSAStartup function initiates the use of the Windows Sockets DLL by a process.
    The WSAStartup function returns a pointer to the WSADATA structure taken as parameter. */
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0)
    {
        cout << "Unable to find Windows Sockets DLL. Error Code: " << WSAGetLastError() << endl;
        return 1;
    }

    // Create a socket that is bound to a specific transport service provider
    SOCKET wsocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (wsocket == INVALID_SOCKET)
    {
        cout << "Could not create socket. Error code: " << WSAGetLastError() << endl;
        return 1;
    }

    // Use port if specified by user, else use default port 11211
    int port = 11211;
    if (argc == 3 && strcmp(argv[1], "-p") == 0)
        port = atoi(argv[2]);

    // Bind socket to an IP address and port
    struct sockaddr_in server {};
    server.sin_family = AF_INET;
    server.sin_addr.s_addr = inet_addr("127.0.0.1");
    server.sin_port = htons(port);
    int server_len = sizeof(server);

    if (bind(wsocket, (SOCKADDR *)&server, server_len) != 0)
    {
        cout << "Bind failed with error code: " << WSAGetLastError() << endl;
        return 1;
    }

    // Listen for incoming connection requests on the created socket
    if (listen(wsocket, MAXCLIENTS) != 0)
    {
        cout << "Listen failed with error code : " << WSAGetLastError() << endl;
        return 1;
    }

    cout << "Server created successfully." << endl;

    vector<thread *> threads;

    while (true)
    {
        // Keep accepting new connections
        SOCKET new_wsocket = accept(wsocket, (SOCKADDR *)&server, &server_len);
        if (new_wsocket == INVALID_SOCKET)
        {
            cout << "Accept failed with error code: " << WSAGetLastError() << endl;
            return 1;
        }

        // Handle each connection in a separate thread
        threads.push_back(new thread(handleConnection, new_wsocket));
    }

    // Wait for all threads to finish
    for (auto t : threads)
        t->join();
    
    closesocket(wsocket);

    WSACleanup(); // Terminates the use of the Windows Sockets DLL

    return 0;
}
