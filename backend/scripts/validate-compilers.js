const { executeCode } = require('../utils/codeExecutor');

// Common student coding patterns
const studentCodes = {
  java: {
    'Hello World': `
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}`,
    'Simple Addition': `
import java.util.Scanner;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println(a + b);
        sc.close();
    }
}`,
    'Array Sum': `
public class Main {
    public static void main(String[] args) {
        int[] arr = {1, 2, 3, 4, 5};
        int sum = 0;
        for(int i = 0; i < arr.length; i++) {
            sum += arr[i];
        }
        System.out.println(sum);
    }
}`
  },
  python: {
    'Hello World': `print("Hello World")`,
    'Simple Addition': `
a = int(input())
b = int(input())
print(a + b)`,
    'List Sum': `
numbers = [1, 2, 3, 4, 5]
print(sum(numbers))`
  },
  cpp: {
    'Hello World': `
#include <iostream>
using namespace std;
int main() {
    cout << "Hello World" << endl;
    return 0;
}`,
    'Simple Addition': `
#include <iostream>
using namespace std;
int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}`,
    'Array Sum': `
#include <iostream>
using namespace std;
int main() {
    int arr[] = {1, 2, 3, 4, 5};
    int sum = 0;
    for(int i = 0; i < 5; i++) {
        sum += arr[i];
    }
    cout << sum << endl;
    return 0;
}`
  }
};

const testInputs = {
  'Simple Addition': '5 3',
  'Hello World': '',
  'Array Sum': '',
  'List Sum': ''
};

async function validateCompilers() {
  console.log('🔍 COMPILER VALIDATION');
  console.log('======================');
  
  let totalTests = 0;
  let passedTests = 0;
  
  for (const [language, codes] of Object.entries(studentCodes)) {
    console.log(`\n=== ${language.toUpperCase()} Validation ===`);
    
    for (const [testName, code] of Object.entries(codes)) {
      totalTests++;
      const input = testInputs[testName] || '';
      
      try {
        const result = await executeCode(code, language, input);
        const passed = result.success;
        
        console.log(`${testName}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`  Output: "${result.output}"`);
        
        if (!passed) {
          console.log(`  Error: ${result.error}`);
        }
        
        if (passed) passedTests++;
        
      } catch (error) {
        console.log(`${testName}: ❌ FAIL - ${error.message}`);
      }
    }
  }
  
  console.log(`\n📊 VALIDATION SUMMARY`);
  console.log(`=====================`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  const allPassed = passedTests === totalTests;
  console.log(`\nStatus: ${allPassed ? '✅ ALL COMPILERS VALIDATED' : '❌ VALIDATION FAILED'}`);
  
  return allPassed;
}

if (require.main === module) {
  validateCompilers().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

module.exports = { validateCompilers };