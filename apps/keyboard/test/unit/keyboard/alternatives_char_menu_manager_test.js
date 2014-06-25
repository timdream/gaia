'use strict';

/* global AlternativesCharMenuManager */

require('/js/keyboard/alternatives_char_menu_manager.js');

suite('AlternativesCharMenuManager', function() {
  var app;
  var container;
  var alternatives;
  var manager;
  var target;

  var getFakeElementWithGetBoundingClientRect;

  setup(function() {
    getFakeElementWithGetBoundingClientRect = function() {
      return {
        getBoundingClientRect: this.sinon.stub()
      };
    }.bind(this);

    // Create fake IMERender
    window.IMERender = {
      showAlternativesCharMenu: function(target, alternatives) {
        // Use an Array to simulate a NodeList
        container.children = alternatives.map(function(key) {
          return {};
        });
      },
      hideAlternativesCharMenu: this.sinon.stub()
    };
    this.sinon.spy(window.IMERender, 'showAlternativesCharMenu');

    // Create fake menu container element
    container = getFakeElementWithGetBoundingClientRect();
    container.getBoundingClientRect.returns({
      top: 35,
      bottom: 45,
      left: 5,
      right: 95
    });

    // Create fake app
    app = {
      getMenuContainer: function() {
        return container;
      }
    };

    // Create fake target
    target = getFakeElementWithGetBoundingClientRect();
    target.getBoundingClientRect.returns({
      top: 50,
      bottom: 60,
      left: 10,
      right: 40
    });

    // alternatives to show
    alternatives = ['a', 'b', 'c', 'd'];

    // Show an alternatives chars menu
    manager = new AlternativesCharMenuManager(app);
    manager.start();

    assert.equal(manager.isShown, false);

    manager.show(target, alternatives);

    assert.isTrue(
      window.IMERender.
        showAlternativesCharMenu.calledWith(target, alternatives));
    assert.isTrue(manager.isShown);
  });

  teardown(function() {
    window.IMERender = null;
    app = null;
    container = null;
  });

  test('hide', function() {
    manager.hide();

    assert.equal(manager.isShown, false);
    assert.isTrue(window.IMERender.hideAlternativesCharMenu.calledOnce);
  });

  suite('isInMenuArea', function() {
    test('above menu', function() {
      var press = {
        pageX: 45,
        pageY: 35
      };

      assert.equal(manager.isInMenuArea(press), false);
    });

    test('below key', function() {
      var press = {
        pageX: 45,
        pageY: 70
      };

      assert.equal(manager.isInMenuArea(press), false);
    });

    test('left of menu', function() {
      var press = {
        pageX: 2,
        pageY: 55
      };

      assert.equal(manager.isInMenuArea(press), false);
    });

    test('right of menu', function() {
      var press = {
        pageX: 105,
        pageY: 55
      };

      assert.equal(manager.isInMenuArea(press), false);
    });

    test('on top of the menu', function() {
      var press = {
        pageX: 45,
        pageY: 40
      };

      assert.equal(manager.isInMenuArea(press), false);
    });

    test('on top of the key', function() {
      var press = {
        pageX: 15,
        pageY: 55
      };

      assert.equal(manager.isInMenuArea(press), true);
    });

    test('below menu and beside key', function() {
      var press = {
        pageX: 65,
        pageY: 55
      };

      assert.equal(manager.isInMenuArea(press), true);
    });

    test('below menu and above key', function() {
      var press = {
        pageX: 65,
        pageY: 47
      };

      assert.equal(manager.isInMenuArea(press), true);
    });
  });

  suite('getMenuTarget', function() {
    test('on top of the key', function() {
      var press = {
        target: target,
        pageX: 15,
        pageY: 55
      };

      assert.equal(manager.getMenuTarget(press),
        container.children[0]);
    });

    test('under 2nd key', function() {
      var press = {
        target: {},
        pageX: 35,
        pageY: 55
      };

      assert.equal(manager.getMenuTarget(press),
        container.children[1]);
    });

    test('under 2nd key but haven\'t moved away from target', function() {
      var press = {
        target: target,
        pageX: 35,
        pageY: 55
      };

      assert.equal(manager.getMenuTarget(press),
        container.children[0]);
    });

    test('under 2nd key, had moved away from target', function() {
      var press = {
        target: {},
        pageX: 45,
        pageY: 55
      };

      assert.equal(manager.getMenuTarget(press),
        container.children[1]);

      var press2 = {
        target: target,
        pageX: 35,
        pageY: 55
      };

      assert.equal(manager.getMenuTarget(press2),
        container.children[1]);
    });
  });
});
