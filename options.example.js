
module.exports = {

  main: {
    port:3333,
    public:'/public'
  },

  listen: {
    port: 10101
  },

  admin: {
    email: 'a1@example.com',
    name: 'admin',
    password: 'a1'
  },

  auth: {
    // change to true if you want to send emails
    sendemail:true,
    email:{
      subject:{
        register:'Welcome!',
        create_reset:'Password Reset'
      },
      content:{
        resetlinkprefix:'http://localhost:3333/reset',
        confirmlinkprefix:'http://localhost:3333/confirm'
      }
    },
    user: {
      updatefields: ['name','email','image']
    },
    ldap:{
      enabled: false,
      // LDAP_URL environment variable overrides the url setting if it is set
      url: 'ldap://localhost:389',
      base: 'ou=people,dc=ec2,dc=internal',
      filter: '(&(ObjectClass=person)(uid=%s))'
    }
  },

  features: {
    // signup and account features will be disabled if LDAP is enabled (regardless of their settings here)
    signup: true,
    account: true,
    gravatar: true
  },

  // DB_URL environment variable overrides these settings if it is set
  mysql: {
    name:'douitsu',
    host:'localhost',
    user:'douitsu',
    password:'douitsu',
    port:3306
  },

  // CACHE_URL environment variable overrides these settings if it is set
  redis: {
    host:'localhost',
    port:6379
  },

  mail: {
    mail: {from:'youremail@example.com'},
    config:{
      host: 'localhost'
    }
  },

  // Set a different theme for a different look and feel
  theme: {
    // style: '/css/theme/dark.css',
    // logo: 'http://cdn.shopify.com/s/files/1/0201/1862/t/2/assets/logo.png',
    locale: {
      // namespace: 'example'
    },
    page: {
      // dialog: 'theme/example/dialog'
    }
  },

  settings: {
    spec: {
      a:{'type':'text', 'nice':'A', 'help':'Example of text.'},
      b:{'type':'email', 'nice':'B', 'help':'Example of email.'},
      c:{'type':'tel', 'nice':'C', 'help':'Example of tel.'},
      d:{'type':'number', 'nice':'D', 'help':'Example of number.'},
      e:{'type':'time', 'nice':'E', 'help':'Example of time.'},
      f:{'type':'date', 'nice':'F', 'help':'Example of date.'},
      g:{'type':'datetime', 'nice':'G', 'help':'Example of datetime.'},
      h:{'type':'color', 'nice':'H', 'help':'Example of color.'},
      i:{'type':'url', 'nice':'I', 'help':'Example of url.'},
      j:{'type':'checkbox', 'nice':'J', 'help':'Example of checkbox.'},
      k:{'type':'range', 'nice':'K', 'help':'Example of range.', 'default' : 50},
      l:{'type':'rating', 'nice':'L', 'help':'Example of rating.', 'stars' : 6 },
      ll:{'type':'rating', 'nice':'LL', 'help':'Example of rating.'},
      m:{'type':'yesno', 'nice':'M', 'help':'Example of yesno.'},
      n:{'type':'onoff', 'nice':'N', 'help':'Example of onoff slider.', 'default' : 0},
      o:{'type':'buttons', 'nice':'O', 'help':'Example of buttons.', 'options' : ['foo', 'bar', 'baz']},
      p:{'type':'dropdown', 'nice':'P', 'help':'Example of dropdown.', 'options' : ['foo', 'bar', 'baz']},
      q:{'type':'dropdownplus', 'nice':'Q', 'help':'Example of dropdownplus.', 'options' : ['foo', 'bar', 'baz']},
      r:{'type':'longtext', 'nice':'R', 'help':'Example of longtext.'},
      s:{'type':'radio', 'nice':'S', 'help':'Example of radio.', 'options' : ['foo', 'bar', 'baz']},
    }
  }

};
