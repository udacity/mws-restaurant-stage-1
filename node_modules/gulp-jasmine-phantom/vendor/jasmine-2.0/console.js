/*
Copyright (c) 2008-2014 Pivotal Labs

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
function getJasmineRequireObj() {
  if (typeof module !== 'undefined' && module.exports) {
    return exports;
  } else {
    window.jasmineRequire = window.jasmineRequire || {};
    return window.jasmineRequire;
  }
}

getJasmineRequireObj().console = function(jRequire, j$) {
  j$.ConsoleReporter = jRequire.ConsoleReporter();
};

getJasmineRequireObj().ConsoleReporter = function() {

  var noopTimer = {
    start: function(){},
    elapsed: function(){ return 0; }
  };

  function ConsoleReporter(options) {
    var print = options.print,
      showColors = options.showColors || false,
      onComplete = options.onComplete || function() {},
      timer = options.timer || noopTimer,
      specCount,
      failureCount,
      failedSpecs = [],
      pendingCount,
      suiteIndentation = 0,
      ansi = {
        green: '\x1B[32m',
        red: '\x1B[31m',
        yellow: '\x1B[33m',
        none: '\x1B[0m'
      };

    this.jasmineStarted = function() {
      specCount = 0;
      failureCount = 0;
      pendingCount = 0;
      print('Started');
      printNewline();
      timer.start();
    };

    this.jasmineDone = function() {
      printNewline();
      for (var i = 0; i < failedSpecs.length; i++) {
        if(!i) {
          print('Failures:');
        }
        specFailureDetails(failedSpecs[i]);
      }
      
      printNewline();

      if(specCount > 0) {

        var successCount = specCount - failureCount,
            specCounts = specCount + ' ' + plural('spec', specCount);

        if(successCount) {
          specCounts += ', ' + colored('green',  successCount + ' ' + plural('success', successCount));
        }
        
        if(failureCount) {
          specCounts += ', ' + colored('red', failureCount + ' ' + plural('failure', failureCount));
        }
        
        if (pendingCount) {
          specCounts += ', ' + colored('yellow', pendingCount + ' pending ');
        }

        print(specCounts);
      } else {
        print('No specs found');
      }
      
      var seconds = timer.elapsed() / 1000;
      print('Finished in ' + seconds + ' ' + plural('second', seconds));


      onComplete(failureCount === 0);
    };

    this.suiteStarted = function(suite) {
      print(indent(suite.fullName, suiteIndentation));
      suiteIndentation += 2; 
    };

    this.suiteDone = function(suite) {
      suiteIndentation -= 2;
    };

    this.specDone = function(result) {
      specCount++;

      if (result.status == 'pending') {
        pendingCount++;
        print(indent(colored('yellow', '* ' + result.fullName), suiteIndentation));
        return;
      }

      if (result.status == 'passed') {
        print(indent(colored('green', '\u2714 ' + result.fullName), suiteIndentation));
        return;
      }

      if (result.status == 'failed') {
        failureCount++;
        failedSpecs.push(result);
        print(indent(colored('red', '\u2716 ' + result.fullName), suiteIndentation));
      }
    };

    return this;

    function printNewline() {
      print('\n');
    }

    function colored(color, str) {
      return showColors ? (ansi[color] + str + ansi.none) : str;
    }

    function plural(str, count) {
      if(str[str.length-1] === 's') {
        return count == 1 ? str : str + 'es';
      }
      return count == 1 ? str : str + 's';
    }

    function repeat(thing, times) {
      var arr = [];
      for (var i = 0; i < times; i++) {
        arr.push(thing);
      }
      return arr;
    }

    function indent(str, spaces) {
      var lines = (str || '').split('\n');
      var newArr = [];
      for (var i = 0; i < lines.length; i++) {
        newArr.push(repeat(' ', spaces).join('') + lines[i]);
      }
      return newArr.join('\n');
    }

    function specFailureDetails(result) {
      print(indent(result.fullName, 2));

      for (var i = 0; i < result.failedExpectations.length; i++) {
        var failedExpectation = result.failedExpectations[i];
        print(indent(colored('red', failedExpectation.message), 4));
        //print(indent(failedExpectation.stack, 2));
      }
      
    }
  }

  return ConsoleReporter;
};
