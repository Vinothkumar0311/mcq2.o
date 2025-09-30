# Java Setup Guide

## Quick Installation

Run this command to install Java JDK:

```bash
sudo apt update && sudo apt install -y default-jdk
```

## Manual Installation Steps

1. **Update package list:**
   ```bash
   sudo apt update
   ```

2. **Install Java JDK:**
   ```bash
   sudo apt install default-jdk
   ```

3. **Verify installation:**
   ```bash
   java -version
   javac -version
   ```

## Alternative Installation (if default-jdk doesn't work)

```bash
sudo apt install openjdk-11-jdk
```

## After Installation

1. Restart your backend server
2. Test Java code execution in the platform

## Troubleshooting

If you get "javac: command not found":
- Make sure Java JDK is installed (not just JRE)
- Check PATH: `echo $PATH`
- Restart terminal/server after installation

## Test Java Installation

Create a test file `Test.java`:
```java
public class Test {
    public static void main(String[] args) {
        System.out.println("Java is working!");
    }
}
```

Compile and run:
```bash
javac Test.java
java Test
```

Should output: "Java is working!"