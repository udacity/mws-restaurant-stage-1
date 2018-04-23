var pipe = require('./index'),
    stream = require('stream');

pipe(
  s('method1'),
  [
    stage1(),
    stage2(),
    stage3(),
    check('method1stage1stage2stage3')
  ])
  .on('error', function(err) {console.log(err); process.exit(1);});

pipe(
  [
    s('method2'),
    stage1(),
    stage2(),
    stage3(),
    check('method2stage1stage2stage3')
  ])
  .on('error', function(err) {console.log(err); process.exit(1);});

pipe(
  s('method1'),
  [
    stage1(),
    stage2(),
    stage3(),
    check('should fail!')
  ])
  .on('error', function(err) {/*eat it*/})
  .on('finish', function() {
    console.log('method1 should have failed');
    process.exit(1);
  });

pipe(
  [
    s('method2'),
    stage1(),
    stage2(),
    stage3(),
    check('should fail!')
  ])
  .on('error', function(err) {/*eat it*/})
  .on('finish', function() {
    console.log('method2 should have failed!');
    process.exit(1);
  });


function s(data) {
  var ws = stream.Transform();

  ws.push(data);
  ws.push(null);

  ws._transform = function(data, encoding, callback) {
    callback(null, data);
  };

  return ws;
}

function stage1() {
  return testStream('stage1');
}

function stage2() {
  return testStream('stage2');
}

function stage3() {
  return testStream('stage3');
}

function testStream(name) {
  var ws = stream.Transform();

  ws._transform = function(data, encoding, callback) {
    callback(null, data + name);
  };

  return ws;
}

function check(pass) {
  var rs = stream.Transform();

  rs._transform = function(data, encoding, callback) {
    var final = data.toString();

    if (pass !== final) callback(new Error(['Test failed! Expected:', pass, 'Got:', final].join(' ')), null);
    else callback(null, null);
  };

  return rs;
}
