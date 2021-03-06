/**
 * Copyright 2013 The Closure Library Authors. All Rights Reserved.
 * Author: malteubl@google.com (Malte Ubl)
 */

goog.setTestOnly();
goog.require('goog.async.Deferred');
goog.require('goog.testing.jsunit');

function shouldRunTests() {
  return !!Error.captureStackTrace;
}

function testErrorStack() {
  var d;
  // Get the deferred from somewhere deep in the callstack.
  (function immediate() {
    (function immediate2() {
      d = new goog.async.Deferred();
      d.addCallback(function actuallyThrows() { throw new Error('Foo'); });
    })();
  })();

  window.setTimeout(function willThrow() {
    (function callbackCaller() { d.callback(); })();
  }, 0);

  return d.then(fail, function(error) {
    assertContains('Foo', error.stack);
    assertContains('testErrorStack', error.stack);
    assertContains('callbackCaller', error.stack);
    assertContains('willThrow', error.stack);
    assertContains('actuallyThrows', error.stack);
    assertContains('DEFERRED OPERATION', error.stack);
    assertContains('immediate', error.stack);
    assertContains('immediate2', error.stack);
  });
}


function testErrorStack_forErrback() {
  var d = new goog.async.Deferred();

  window.setTimeout(function willThrow() { d.errback(new Error('Foo')); }, 0);

  return d.then(fail, function(error) {
    assertContains('Foo', error.stack);
    assertContains('testErrorStack_forErrback', error.stack);
    assertContains('willThrow', error.stack);
    assertContains('DEFERRED OPERATION', error.stack);
  });
}


function testErrorStack_nested() {
  var d = new goog.async.Deferred();

  window.setTimeout(function async1() {
    var nested = new goog.async.Deferred();
    nested.addErrback(function nestedErrback(error) { d.errback(error); });
    window.setTimeout(function async2() {
      (function immediate() { nested.errback(new Error('Foo')); })();
    });
  }, 0);

  return d.then(fail, function(error) {
    assertContains('Foo', error.stack);
    assertContains('testErrorStack_nested', error.stack);
    assertContains('async1', error.stack);
    assertContains('async2', error.stack);
    assertContains('immediate', error.stack);
    assertContains('DEFERRED OPERATION', error.stack);
  });
}


function testErrorStack_doesNotTouchCustomStack() {
  var d = new goog.async.Deferred();
  d.addCallback(function actuallyThrows() {
    var e = new Error('Foo');
    e.stack = 'STACK';
    throw e;
  });

  window.setTimeout(function willThrow() {
    (function callbackCaller() { d.callback(); })();
  }, 0);

  return d.then(fail, function(error) { assertEquals('STACK', error.stack); });
}
