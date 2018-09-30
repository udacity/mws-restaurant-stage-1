var noopTimer = {
  start: function(){},
  elapsed: function(){ return 0; }
};

exports.TerminalReporter = function(options) {
  var print = console.log,
    showColors = options.showColors || false,
    done = options.done || function() {},
    timer = options.timer || noopTimer,
    stackTrace = options.includeStackTrace || false,
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

  this.jasmineDone = function(result) {
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

    if (result && result.order && result.order.random) {
      print('Randomized with seed ' + result.order.seed);
      printNewline();
    }

    done(failureCount === 0);
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
      print(indent(colored('yellow', '* ' + result.description), suiteIndentation));
      return;
    }

    if (result.status == 'passed') {
      print(indent(colored('green', '\u2714 ' + result.description), suiteIndentation));
      return;
    }

    if (result.status == 'failed') {
      failureCount++;
      failedSpecs.push(result);
      print(indent(colored('red', '\u2716 ' + result.description), suiteIndentation));
    }
  };

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
      if(stackTrace) {
        print(indent(failedExpectation.stack, 2));
      }
    }

  }
};
