'use strict';

var underscore = require('underscore');

module.exports = function( options ) {
  var seneca = this;
  var plugin = 'datetimemap';

  options = seneca.util.deepextend({},options);

  function inward_alias(fields,aliasmap) {
    if(!fields) {return;}

    underscore.each(aliasmap, function(internal){
      if( !underscore.isUndefined( fields[internal] ) ) {
        if (typeof fields[internal] === 'string' || fields[internal] instanceof String) {
          // Convert ISO format to datetime accepted by MySQL
          // eg 2014-03-20T11:57:25.000Z to 2014-03-20T11:57:25
          fields[internal] = fields[internal].split('.')[0];
        }
      }
    });
  }


  function outward_alias(fields,aliasmap) {
    if(!fields) {return;}

    underscore.each(aliasmap, function(internal){
      if( !underscore.isUndefined( fields[internal] ) ) {
        if (typeof fields[internal] === 'string' || fields[internal] instanceof String) {
          // Convert datetime accepted by MySQL back to ISO format
          // eg 2014-03-20T11:57:25 to 2014-03-20T11:57:25.000Z
          fields[internal] = fields[internal] + '.000Z';
        }
      }
    });
  }



  var aliasmap = {
    save: function( aliasmap ) {
      return function( args, done ) {
        inward_alias(args.ent,aliasmap);
        this.prior(args,function(err,out){
          if(err) {return done(err);}
          outward_alias(out,aliasmap);
          done(null,out);
        });
      };
    },
    load: function( aliasmap ) {
      return function( args, done ) {
        inward_alias(args.q,aliasmap);
        this.prior(args,function(err,out){
          if(err) {return done(err);}
          outward_alias(out,aliasmap);
          done(null,out);
        });
      };
    },
    list: function( aliasmap ) {
      return function( args, done ) {
        inward_alias(args.q,aliasmap);
        this.prior(args,function(err,list){
          if(err) {return done(err);}
          underscore.each(list,function(item){outward_alias(item,aliasmap);});
          done(null,list);
        });
      };
    },
    remove: function( aliasmap ) {
      return function( args, done ) {
        inward_alias(args.q,aliasmap);
        this.prior(args,function(err,out){
          if(err) {return done(err);}
          outward_alias(out,aliasmap);
          done(null,out);
        });
      };
    }
  };

  function mapper( spec ) {
    return function(args,done) {
      var seneca = this;
      var aliasfunc = aliasmap[args.cmd](spec.alias||{});
      if( aliasfunc ) {return aliasfunc.call(seneca,args,done);}

      return seneca.prior(args,done);
    };
  }


  seneca.add({init:plugin}, function( args, done ){
    var map = options.map || {};

    underscore.each( map, function(v,k){
      var canon = seneca.util.parsecanon(k);

      var entargs = underscore.extend({role:'entity'},canon);

      var cmds = seneca.store.cmds || ['save','load','list','remove','close','native'];

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
