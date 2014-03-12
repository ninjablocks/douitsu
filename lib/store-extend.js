/* Copyright (c) 2014 Richard Rodger, MIT License */
'use strict';

var underscore = require('underscore');

module.exports = function( options ) {
  var seneca = this;
  var plugin = 'store-extend';



  options = seneca.util.deepextend({
  },options);



  var store = {
    save: function( aliasmap ) {
      return function( args, done ) {

        // Set updated field
        var updatedfield = aliasmap.updated || 'updated';
        args.ent[updatedfield] = new Date().toISOString();

        this.prior(args, done);
      };
    }
  };

  function mapper( spec ) {
    return function(args,done) {
      var seneca = this;
      var aliasfunc = store[args.cmd](spec.alias||{});
      if( aliasfunc ) {return aliasfunc.call(seneca,args,done);}

      return seneca.prior(args,done);
    };
  }


  seneca.add({init:plugin}, function( args, done ){
    var map = options.map || {};

    underscore.each( map, function(v,k){
      var canon = seneca.util.parsecanon(k);

      var entargs = underscore.extend({role:'entity'},canon);

      var cmds = ['save'];

      underscore.each( cmds, function( cmd ){
        var cmdargs = underscore.extend({cmd:cmd},entargs);
        seneca.add( cmdargs, mapper(v) );
      });
    });

    done();
  });


  return {
    name: plugin
  };
};
