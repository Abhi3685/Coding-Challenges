#include <bits/stdc++.h>
#include <sys/stat.h>
using namespace std;

void printHelpText()
{
    cout << endl;
    cout << ">>>>>>>>>> Help <<<<<<<<<<" << endl;
    cout << "1. Count number of bytes in a file: ./ccwc.exe -c <fileName.txt>" << endl;
    cout << "2. Count number of lines in a file: ./ccwc.exe -l <fileName.txt>" << endl;
    cout << "3. Count number of words in a file: ./ccwc.exe -w <fileName.txt>" << endl;
    cout << "4. Count number of characters in a file: ./ccwc.exe -m <fileName.txt>" << endl;
    cout << "5. Pipe the output from any other command as input: cat <fileName.txt> | ./ccwc.exe -l" << endl;
    cout << endl;
}

int countBytes(const string &filename = "")
{
    int bytes = 0;

    if (filename.empty())
    {
        if (!cin.good()) {
            cerr << "Error reading from stdin" << endl;
            return -1;
        }

        char ch = '\0';
        while (cin.get(ch)) {
            bytes += sizeof(char);
        }
    }
    else
    {
        struct stat64 statBuf;
        int rc = stat64(filename.c_str(), &statBuf);
        
        if (rc != 0) {
            cerr << "stat64 failed with return code " << rc << endl;
            return -1;
        }

        bytes = statBuf.st_size;
    }

    return bytes;
}

int countLines(const string &filename = "")
{
    string line = "";
    int lines = 0;

    if (filename.empty()) {
        while (getline(cin, line)) {
            lines++;
        }
    } else {
        ifstream st(filename.c_str());
        while (getline(st, line)) {
            lines++;
        }
    }

    return lines;
}

int countWords(const string &filename = "")
{
    string word = "";
    int words = 0;

    if (filename.empty()) {
        while ( cin >> word ) {
            words++;
        }
    } else {
        ifstream input(filename.c_str());
        while ( input >> word ) {
            words++;
        }
    }

    return words;
}

int countCharacters(const string &filename = "")
{
    string line = "";
    int chars = 0;

    if (filename.empty())
    {
        while (getline(cin, line)) {
            chars += line.length() + 1;
        }
    }
    else
    {
        FILE *fp = fopen(filename.c_str(), "rb");
        if (fp ==  NULL) {
            cerr << "Failed to open file " << filename << endl;
            return -1;
        }

        fseek(fp, 0, SEEK_END);
        chars = ftell(fp);
        fclose(fp);
    }

    return chars;
}

int main(int argc, char* argv[])
{
    for (int i = 1; i < argc; i += 2)
    {
        string option = argv[i];
        string value = (i + 1 < argc ? argv[i + 1] : "");

        if (strcmp(option.c_str(), "-c") == 0) {
            cout << countBytes(value) << " ";
        } else if (strcmp(option.c_str(), "-l") == 0) {
            cout << countLines(value) << " ";
        } else if (strcmp(option.c_str(), "-w") == 0) {
            cout << countWords(value) << " ";
        } else if (strcmp(option.c_str(), "-m") == 0) {
            cout << countCharacters(value) << " ";
        } else if (strcmp(option.c_str(), "-h") == 0) {
            printHelpText();
        } else {
            cout << countBytes(argv[i]) << " ";
            cout << countLines(argv[i]) << " ";
            cout << countWords(argv[i]) << " ";
        }

        if (!value.empty())
            cout << value << endl;
    }

    return 0;
}
