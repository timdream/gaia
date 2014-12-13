'use strict';

/* global KeyboardEvent */

window.PAGE_INDEX_DEFAULT = 0;
window.InputMethods = {};

suite('latin.js', function() {
  var engine;
  var glue;

  // We pass the same workerStub because latin engine reuse the worker
  // between activations.
  var workerStub = {
    onmessage: null,
    postMessage: function() { /* to be stubbed between tests */}
  };

  // Load the script once and attach it to |engine|.
  suiteSetup(function(done) {
    require('/js/imes/latin/latin.js', function() {
      engine = window.InputMethods.latin;

      done();
    });
  });

  setup(function() {
    this.sinon.stub(workerStub, 'postMessage');

    this.sinon.stub(window, 'Worker').returns(workerStub);

    glue = {
      __output: '',
      __isUpperCase: false,
      __mResolveSendKey: true,

      sendKey: this.sinon.spy(function(keycode) {
        if (!this.__mResolveSendKey) {
          return Promise.reject();
        }

        if (keycode === 8) { // backspace
          this.__output =
            this.__output.substring(0, this.__output.length - 1);
        }
        else {
          this.__output += String.fromCharCode(keycode);
        }

        return Promise.resolve();
      }),

      sendCandidates: this.sinon.stub(),

      setUpperCase: this.sinon.spy(function setUpperCase(state) {
        this.__isUpperCase = state.isUpperCase;
      }),

      setLayoutPage: this.sinon.stub(),

      isCapitalized: this.sinon.spy(function isCapitalized() {
        return this.__isUpperCase;
      }),

      replaceSurroundingText: this.sinon.stub().returns(Promise.resolve())
    };

    // We are not suppose to call init() more than once in the real setup,
    // but we have to reset the glue for each test here.
    //
    // However, for each of the tests, we will activate() the engine with
    // desired conditions and deactivate on teardown().
    engine.init(glue);
  });

  suite('Capitalization and punctuation behavior', function() {
    // These tests verify that the latin input method is doing what it should.
    // They pass input to the IM by calling its click() method, and verify that
    // the input method sends back the expected output through the sendKey
    // function that we pass it.  The latin input method sends suggestions
    // asynchronously, but other parts are synchronous


    // The capitalization and punctuation behavior of the Latin IM depends
    // on these variables:
    //
    //   input field type
    //   input mode
    //   existing text in input field
    //   cursor position
    //   whether there is a selection

    // Test each of these types
    var types = [
      'text',
      'textarea',
      'search',
      'url',
      'email'
    ];

    // Test these input modes
    var modes = [
      '',
      'verbatim',
      'latin',
      'latin-prose'
    ];

    var contentStates = {
      // empty input field
      empty: { value: '', cursor: 0 },
      // cursor is in the middle of a bunch of spaces
      inSpace: { value: 'a      b', cursor: 4},

      // cursor is at the start, middle, or end of the input field
      start: { value: 'word', cursor: 0 },
      middle: { value: 'word', cursor: 2 },
      end: { value: 'word', cursor: 4 },

      // like the above, but all uppercase
      startUppercase: { value: 'WORD', cursor: 0 },
      middleUppercase: { value: 'WORD', cursor: 2 },
      endUppercase: { value: 'WORD', cursor: 4 },

      // cursor is at the start, middle, or end of a word in the middle
      wordStart: { value: 'and then what', cursor: 4 },
      wordMiddle: { value: 'and then what', cursor: 6 },
      wordEnd: { value: 'and then what', cursor: 8 },

      // cursor is after a sentence, before another
      afterSentence: { value: 'Foo. Bar.', cursor: 5 },
      afterQuestion: { value: 'Foo? Bar.', cursor: 5 },
      afterExclamation: { value: 'Foo! Bar.', cursor: 5 }
    };

    // Utility function
    var capitalizeWord = function capitalizeWord(word) {
      if (word.length === 0) {
        return word;
      }
      return word[0].toUpperCase() + word.substring(1);
    };

    // Test all the permutations of states above against these inputs.
    // The property name is the input. The property value is a function
    // that returns the expected output

    // Does space punc get transposed to punc space?
    var expectedPunctuation =
    function expectedPunctuation(input, type, mode, value, cursor) {
      // Don't run all permutations of this test for all inputs.
      if (input[1] !== '.' && (type !== 'textarea' || mode !== 'latin-prose')) {
        return;
      }

      // if the type is wrong, do nothing
      if (type !== 'text' && type !== 'textarea' && type !== 'search') {
        return input;
      }
      // if the mode is wrong do nothing
      if (mode === 'verbatim' || mode === 'latin') {
        return input;
      }
      // If mode is not specified, and we're not a text area, that is the
      // same as latin mode, so do nothing
      if (!mode && type !== 'textarea') {
        return input;
      }
      // If input is a space followed by a colon or semicolon, do not transpose.
      // This facilitates the entry of emoticons such as :O
      if (input === ' :' || input === ' ;') {
        return input;
      }

      // If the previous character is a letter, transpose otherwise don't
      if (cursor > 0 && /[a-zA-Z]/.test(value.charAt(cursor - 1))) {
        return input[1] + input[0];
      }

      return input;
    };

    var expectedSpaceSpace =
    function expectedSpaceSpace(input, type, mode, value, cursor) {
      // if the type is wrong, do nothing
      if (type !== 'text' && type !== 'textarea' && type !== 'search') {
        return input;
      }
      // if the mode is wrong do nothing
      if (mode === 'verbatim' || mode === 'latin') {
        return input;
      }
      // If mode is not specified, and we're not a text area, that is the
      // same as latin mode, so do nothing
      if (!mode && type !== 'textarea') {
        return input;
      }

      // If the previous character is a letter, return dot space
      if (cursor > 0 && /[a-zA-Z]/.test(value[cursor - 1])) {
        return '. ';
      }

      return '  ';
    };

    var expectedCapitalization =
    function expectedCapitalization(input, type, mode, value, cursor) {
      // if the type is wrong, do nothing
      if (type !== 'text' && type !== 'textarea' && type !== 'search') {
        return input;
      }
      // if the mode is wrong do nothing
      if (mode === 'verbatim' || mode === 'latin') {
        return input;
      }
      // If mode is not specified, and we're not a text area, that is the
      // same as latin mode, so do nothing
      if (!mode && type !== 'textarea') {
        return input;
      }

      // If we're still here, we're in latin-prose mode, and we may need
      // to capitalize, depending on the value and cursor position.
      if (cursor === 0) {
        return capitalizeWord(input);
      }

      // if the character before the cursor is not a space, don't capitalize
      if (!/\s/.test(value[cursor - 1])) {
        return input;
      }

      // If we're at then end of a sentence, capitalize
      if (/[.?!]\s+$/.test(value.substring(0, cursor))) {
        return capitalizeWord(input);
      }

      // Otherwise, just return the input
      return input;
    };

    var inputs = {
      'ab': expectedCapitalization,   // Does it get capitalized?
      '  ': expectedSpaceSpace,       // Does it turn into ". "?
      ' .': expectedPunctuation,      // Does it get transposed?
      ' !': expectedPunctuation,      // Does it get transposed?
      ' ?': expectedPunctuation,      // Does it get transposed?
      ' ,': expectedPunctuation,      // Does it get transposed?
      ' ;': expectedPunctuation,      // Does it get transposed?
      ' :': expectedPunctuation       // Does it get transposed?
    };

    var constructTest =
    function constructTest(input, type, mode, statename, options) {
      var modeTitle = '-' + (mode ? mode : 'default');
      var optionsTitle = options ? '-' + JSON.stringify(options) : '';
      var testname = type + modeTitle + '-' + statename + optionsTitle +
                     '-' + input;
      var state = contentStates[statename];
      var expected =
        inputs[input](input, type, mode, state.value, state.cursor);

      // Skip the test if the expected function returns nothing.
      // This is so we don't have too large a number of tests.
      if (expected === undefined) {
        return;
      }

      test(testname, function(done) {
        function queue(q, n) {
          q.length ? q.shift()(queue.bind(null, q, n)) : n();
        }

        // activate the IM
        engine.activate('en', {
          type: type,
          inputmode: mode,
          value: state.value,
          selectionStart: state.cursor,
          selectionEnd: state.cursor
        },{ suggest: false, correct: false });

        var inputQueue;
        if (options && options.continuous) {
          var lastPromise;
          input.split('').forEach(function(c) {
            lastPromise =
              engine.click(c.charCodeAt(0), c.toUpperCase().charCodeAt(0));
          });

          lastPromise.then(function() {
            assert.equal(
              glue.__output, expected,
              'expected "' + expected + '" for input "' + input + '"');
          }, function() {
            assert.ok(false, 'should not reject');
          }).then(done, done);
        } else {
          // Send the input one character at a time, converting
          // the input to uppercase if the IM has set uppercase
          inputQueue = input.split('').map(function(c) {
            return function(n) {
              engine.click(
                c.charCodeAt(0), c.toUpperCase().charCodeAt(0)).then(n);
            };
          });

          queue(inputQueue, function() {
            assert.equal(
              glue.__output, expected,
              'expected "' + expected + '" for input "' + input + '"');
            done();
          });
        }
      });
    };

    // For each test, we activate() the IM with a given initial state,
    // then send it some input, and check the output.
    // The initial state includes language, whether suggestions are enabled,
    // input type, input mode, input value, cursor position
    // (or selectionstart, selection end).
    // There are lots of possible initial states, and we may have different
    // output in each case.

    teardown(function() {
      engine.deactivate();
    });

    suite('Input keys one by one', function() {
      for (var t = 0; t < types.length; t++) {
        var type = types[t];
        for (var m = 0; m < modes.length; m++) {
          var mode = modes[m];
          for (var statename in contentStates) {
            for (var input in inputs) {
              constructTest(input, type, mode, statename);
            }
          }
        }
      }
    });

    suite('Input keys continuously', function() {
      for (var t = 0; t < types.length; t++) {
        var type = types[t];
        for (var m = 0; m < modes.length; m++) {
          var mode = modes[m];
          for (var statename in contentStates) {
            for (var input in inputs) {
              constructTest(input, type, mode, statename, {continuous: true});
            }
          }
        }
      }
    });
  });

  suite('Suggestions', function() {
    var queue = function queue(q, n) {
      q.length ? q.shift()(queue.bind(null, q, n)) : n();
    };

    var activateEngineWithState =
    function activateEngineWithState(value, cursorStart, cursorEnd) {
      engine.activate('en', {
        type: 'text',
        inputmode: 'latin-prose',
        value: value,
        selectionStart: cursorStart || value.length,
        selectionEnd: cursorEnd || value.length
      }, {
        suggest: true,
        correct: true
      });
    };

    var activateAndTestPrediction =
    function activateAndTestPrediction(value, input, suggestions) {
      activateEngineWithState(value);

      workerStub.onmessage({
        data: {
          cmd: 'predictions',
          input: input, // old input
          suggestions: suggestions
        }
      });
    };

    teardown(function() {
      engine.deactivate();
    });

    test('Suggestion data doesnt match input? Ignore.', function() {
      activateAndTestPrediction('janj', 'jan', [
          ['Jan', 1],
          ['jan', 1],
          ['Pietje', 1]
        ]);
      sinon.assert.callCount(glue.sendCandidates, 1);
      // maybe we shouldnt call this at all? don't know...
      sinon.assert.calledWith(glue.sendCandidates, []);
    });

    test('One char input "n" should not autocorrect to a multichar word',
    function() {
      activateAndTestPrediction('n', 'n', [
          ['no', 1], // we want to ensure that this first suggestion is not
                  // marked (with * prefix) as an autocorrection
          ['not', 1],
          ['now', 1]
        ]);

      sinon.assert.callCount(glue.sendCandidates, 1);
      // maybe we shouldnt call this at all? don't know...
      sinon.assert.calledWith(glue.sendCandidates,
        ['no', 'not', 'now']); // Make sure we do not get "*no"
    });

    test('One char input "i" should autocorrect to a multichar word',
    function() {
      // But we also want to be sure that single letters like i do get
      // autocorrected to single letter words like I
      activateAndTestPrediction('i', 'i', [
          ['I', 1], // we want to ensure that this first suggestion is not
                  // marked (with * prefix) as an autocorrection
          ['in', 1],
          ['it', 1]
        ]);

      sinon.assert.calledWith(
        glue.sendCandidates, ['*I', 'in', 'it']);
    });

    test('Space to accept suggestion', function(next) {
      activateAndTestPrediction('jan', 'jan', [
        ['Jan'],
        ['han'],
        ['Pietje']
      ]);

      engine.click(KeyboardEvent.DOM_VK_SPACE).then(function() {
        sinon.assert.callCount(glue.replaceSurroundingText, 1);
        sinon.assert.calledWith(glue.replaceSurroundingText, 'Jan', -3, 3);
        sinon.assert.calledWith(glue.sendKey, KeyboardEvent.DOM_VK_SPACE);

        next();
      });
    });

    test('Should communicate updated text to worker', function(next) {
      activateEngineWithState('');

      function clickAndAssert(key, assertion, callback) {
        engine.click(key.charCodeAt(0)).then(function() {
          sinon.assert.calledWith(workerStub.postMessage,
                          { args: [assertion], cmd: 'predict' });
          callback();
        });
      }

      queue([
        clickAndAssert.bind(null, 'p', 'p'),
        clickAndAssert.bind(null, 'a', 'pa'),
        clickAndAssert.bind(null, 'i', 'pai')
      ], function() {
        sinon.assert.callCount(workerStub.postMessage, 3);
        next();
      });
    });

    test('Two spaces after suggestion should autopunctuate', function(next) {
      activateAndTestPrediction('jan', 'jan', [
        ['Jan'],
        ['han'],
        ['Pietje']
      ]);

      engine.click(KeyboardEvent.DOM_VK_SPACE).then(function() {
        return engine.click(KeyboardEvent.DOM_VK_SPACE);
      }).then(function() {
        sinon.assert.callCount(glue.replaceSurroundingText, 1);
        sinon.assert.calledWith(glue.replaceSurroundingText, 'Jan', -3, 3);

        sinon.assert.callCount(glue.sendKey, 4);
        assert.equal(glue.sendKey.args[0][0], KeyboardEvent.DOM_VK_SPACE);
        assert.equal(glue.sendKey.args[1][0], KeyboardEvent.DOM_VK_BACK_SPACE);
        assert.equal(glue.sendKey.args[2][0], '.'.charCodeAt(0));
        assert.equal(glue.sendKey.args[3][0], ' '.charCodeAt(0));
        next();
      });
    });

    test('New line then dot should not remove newline', function(next) {
      activateEngineWithState('Hello');

      engine.click(KeyboardEvent.DOM_VK_RETURN).then(function() {
        return engine.click('.'.charCodeAt(0));
      }).then(function() {
        sinon.assert.callCount(glue.replaceSurroundingText, 0);
        sinon.assert.callCount(glue.sendKey, 2);
        assert.equal(glue.sendKey.args[0][0], KeyboardEvent.DOM_VK_RETURN);
        assert.equal(glue.sendKey.args[1][0], '.'.charCodeAt(0));

        next();
      });
    });

    test('dismissSuggestions hides suggestions', function() {
      engine.dismissSuggestions();

      // Send candidates should be called once with an empty array
      // to clear the list of word suggestions
      sinon.assert.callCount(glue.sendCandidates, 1);
      sinon.assert.calledWith(glue.sendCandidates, []);

      // Also, a space should not be inserted
      sinon.assert.callCount(glue.sendKey, 0);
    });

    suite('Uppercase suggestions', function() {
      test('All uppercase input yields uppercase suggestions', function() {
        activateAndTestPrediction('HOLO', 'HOLO', [
            ['yolo', 10],
            ['Yelp', 5],
            ['whuuu', 4]
          ]);

        sinon.assert.callCount(glue.sendCandidates, 1);
        // Verify that we show 3 suggestions that do not include the input
        // and that we do not mark the first as an autocorrection.
        sinon.assert.calledWith(glue.sendCandidates,
                                ['*YOLO', 'YELP', 'WHUUU']);
      });

      test('One char uppercase not yields uppercase suggestions', function() {
        activateAndTestPrediction('F', 'F', [
            ['yolo', 10],
            ['Yelp', 5],
            ['whuuu', 4]
          ]);

        sinon.assert.callCount(glue.sendCandidates, 1);
        // Verify that we show 3 suggestions that do not include the input
        // and that we do not mark the first as an autocorrection.
        sinon.assert.calledWith(glue.sendCandidates,
                                ['yolo', 'Yelp', 'whuuu']);
      });
    });

    suite('handleSuggestions', function() {
      test('input is not a word', function() {
        activateAndTestPrediction('jan', 'jan', [
            ['Jan', 1],
            ['han', 1],
            ['Pietje', 1],
            ['extra', 1]
          ]);

        sinon.assert.callCount(glue.sendCandidates, 1);
        // Show 3 suggestions and mark the first as an autocorrect
        sinon.assert.calledWith(glue.sendCandidates,
                                ['*Jan', 'han', 'Pietje']);
      });

      test('input is a common word', function() {
        activateAndTestPrediction('the', 'the', [
            ['the', 10],
            ['they', 5],
            ['then', 4],
            ['there', 3]
          ]);

        sinon.assert.callCount(glue.sendCandidates, 1);
        // Verify that we show 3 suggestions that do not include the input
        // and that we do not mark the first as an autocorrection.
        sinon.assert.calledWith(glue.sendCandidates,
                                ['they', 'then', 'there']);
      });

      test('input is an uncommon word', function() {
        activateAndTestPrediction('wont', 'wont', [
            ['won\'t', 11],
            ['wont', 8],
            ['won', 7],
            ['went', 6]
          ]);

        sinon.assert.callCount(glue.sendCandidates, 1);
        // Verify that we show 3 suggestions that do not include the input
        // and that we do mark the first as an autocorrection because it is
        // more common than the valid word input.
        sinon.assert.calledWith(glue.sendCandidates,
                                ['*won\'t', 'won', 'went']);
      });

      test('Foe', function() {
        activateAndTestPrediction('foe', 'foe', [
          ['for', 16.878906249999996],
          ['foe', 15],
          ['Doe', 7.566406249999998],
          ['doe', 6.984374999999998]
        ]);

        sinon.assert.callCount(glue.sendCandidates, 1);
        sinon.assert.calledWith(glue.sendCandidates,
                                ['for', 'Doe', 'doe']);
      });

      test('Hid', function() {
        activateAndTestPrediction('hid', 'hid', [
          ['his', 16.296874999999996],
          ['hid', 16],
          ['HUD', 7.415834765624998],
          ['hide', 7.2]
        ]);

        sinon.assert.callCount(glue.sendCandidates, 1);
        sinon.assert.calledWith(glue.sendCandidates,
                                ['his', 'HUD', 'hide']);
      });

      suite('Suggestion length mismatch', function() {
        test('Length mismatch, low freq', function() {
          activateAndTestPrediction('zoolgy', 'zoolgy', [
            ['zoology', 4.2],
            ['Zoology\'s', 0.09504000000000001]
          ]);

          sinon.assert.callCount(glue.sendCandidates, 1);
          sinon.assert.calledWith(glue.sendCandidates,
                                  ['zoology', 'Zoology\'s']);
        });

        test('Length mismatch, medium freq', function() {
          activateAndTestPrediction('Folow', 'Folow', [
            ['Follow', 6.237],
            ['Follows', 2.4948],
            ['Followed', 1.0454400000000001],
            ['Follower', 0.7603200000000001]
          ]);

          sinon.assert.callCount(glue.sendCandidates, 1);
          sinon.assert.calledWith(glue.sendCandidates,
                                  ['*Follow', 'Follows', 'Followed']);
        });

        test('Length mismatch, high freq', function() {
          activateAndTestPrediction('awesomeo', 'awesomeo', [
              ['awesome', 31],
              ['trahlah', 8],
              ['moarstu', 7]
            ]);

          sinon.assert.callCount(glue.sendCandidates, 1);
          sinon.assert.calledWith(glue.sendCandidates,
                                  ['*awesome', 'trahlah', 'moarstu']);
        });
      });
    });
  });

  suite('Reject one of the keys', function() {
    setup(function() {
      engine.activate('en', {
        type: 'text',
        inputmode: '',
        value: '',
        selectionStart: 0,
        selectionEnd: 0
      },{ suggest: false, correct: false });
    });

    teardown(function() {
      engine.deactivate();
    });

    test('reject and resolve another', function(done) {
      glue.__mResolveSendKey = false;

      engine
        .click('a'.charCodeAt(0))
        .then(function() {
          glue.__mResolveSendKey = true;

          return engine.click('b'.charCodeAt(0));
        })
        .then(function() {
          assert.equal('b', glue.__output);
        })
        .catch(function(e) {
          throw (e || 'Should not reject.');
        })
        .then(done, done);
    });
  });

  suite('selectionchange', function() {
    setup(function() {
      engine.activate('en', {
        type: 'text',
        inputmode: '',
        value: 'before after',
        selectionStart: 5,
        selectionEnd: 5
      }, { suggest: true, correct: true });
    });

    teardown(function() {
      engine.deactivate();
    });

    test('will clear the suggestions if selectionchange', function() {
      engine.selectionChange({
        selectionStart: 0,
        selectionEnd: 0,
        ownAction: false
      });

      // will clear the suggestions since cursor changed
      sinon.assert.calledThrice(glue.sendCandidates);
    });

    test('Do nothing if selectionchange is due to our own action', function() {
      engine.selectionChange({
        selectionStart: 5,
        selectionEnd: 5,
        ownAction: true
      });

      // will clear the suggestions since cursor changed
      sinon.assert.calledOnce(glue.sendCandidates);
    });
  });
});
