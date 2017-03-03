(function () {
  var vue = null;
  var pouch = null;
  var defaultDB = null;
  var defaultUsername = null;
  var defaultPassword = null;
  var databases = {};
  
  var vuePouch = {
    created: function() {
      if (!vue) {
        console.warn('[vue-pouch] not installed!')
        return
      }
      var defineReactive = vue.util.defineReactive;
      var vm = this;
      
      var liveFinds = {};
      
      function fetchSession(database) {
        if (['http','https'].indexOf(database.adapter) == -1) return;
        database.getSession().then(function(res) {
          database.getUser(res.userCtx.name).then(function(res) {
            vm.$pouch.session = res;
          }).catch(function(error) {
            vm.$pouch.authError = error
          });
        })
      }
      function login(database) {
        if (['http','https'].indexOf(database.adapter) == -1) return;
        database.login(defaultUsername, defaultPassword).then(function(res) {
          vm.$pouch.session = res;
          database.getUser(defaultUsername).then(function(res) {
            vm.$pouch.session = res;
          })
        }).catch(function(error) {
          vm.$pouch.authError = error
        })
      }
      function logout(database) {
        database.logout()
      }
      
      var $pouch = {
        useAuth: function(username, password) {
          defaultUsername = username;
          defaultPassword = password;
          for (var dbString in databases) {
            if (!databases.hasOwnProperty(dbString)) continue;
            login(databases[dbString]);
          }
          vm.$pouch.gotAuth = true;
        },
        createUser: function(username, password) {
          defaultDB.signup(username, password).then(function(res) {
            vm.$pouch.useAuth(username, password);
          }).catch(function(error) {
            vm.$pouch.authError = error;
          })
        },
        resetAuth: function() {
          defaultUsername = null;
          defaultPassword = null;
          vm.$pouch.gotAuth = false;
          vm.$pouch.session = {}
          if (defaultDB) defaultDB.logout()
        },
        sync: function(localDB, remoteDB, _options) {
          if (!databases[localDB])  databases[localDB] = new pouch(localDB);
          if (!databases[remoteDB]) databases[remoteDB] = new pouch(remoteDB);
          if (!defaultDB) defaultDB = databases[remoteDB];
          var options = Object.assign({}, _options, {live: true, retry: true})
          pouch.sync(databases[localDB], databases[remoteDB], options)
          .on('paused', function (err) {
            // console.log('paused callback')
          })
          .on('active', function () {
            // console.log('active callback')
          })
          .on('denied', function (err) {
            vm.$pouch.errors[localDB] = error
            vm.$pouch.errors = Object.assign({}, vm.$pouch.error)
            // console.log('denied callback')
          })
          .on('complete', function (info) {
            // console.log('complete callback')
          })
          .on('error', function (err) {
            vm.$pouch.errors[localDB] = error
            vm.$pouch.errors = Object.assign({}, vm.$pouch.error)
            // console.log('error callback')
          })
          fetchSession(databases[remoteDB]);
        },
        push: function(localDB, remoteDB, _options) {
          if (!databases[localDB])  databases[localDB] = new pouch(localDB);
          if (!databases[remoteDB]) databases[remoteDB] = new pouch(remoteDB);
          if (!defaultDB) defaultDB = databases[remoteDB];
          var options = Object.assign({}, _options, {live: true, retry: true})
          databases[localDB].replicate.to(databases[remoteDB], options)
          .on('paused', function (err) {
            // console.log('paused callback')
          })
          .on('active', function () {
            // console.log('active callback')
          })
          .on('denied', function (err) {
            vm.$pouch.errors[localDB] = error
            vm.$pouch.errors = Object.assign({}, vm.$pouch.error)
            // console.log('denied callback')
          })
          .on('complete', function (info) {
            // console.log('complete callback')
          })
          .on('error', function (err) {
            vm.$pouch.errors[localDB] = error
            vm.$pouch.errors = Object.assign({}, vm.$pouch.error)
            // console.log('error callback')
          })
          fetchSession(databases[remoteDB]);
        },
        session: {},
        errors: {},
        authError: null,
        gotAuth: false
      }
      defineReactive(vm, '$pouch', $pouch);
      
      var pouchOptions = this.$options.pouch;
      if (!pouchOptions) return;
      if (typeof pouchOptions == 'function') pouchOptions = pouchOptions();
      for (var key in pouchOptions) {
        if (!pouchOptions.hasOwnProperty(key)) continue;
        var pouchFn = pouchOptions[key]
        this.$data[key] = null;
        defineReactive(this, key, null);

        this.$watch(pouchFn, function(config) {
          if (!config) {
            vm[key] = []
            return;
          }
          var selector, sort, skip, limit;
          if (config.selector) {
            selector = config.selector;
            sort: config.sort;
            skip: config.skip;
            limit: config.limit;
          }
          else {
            selector = config
          }
          var databaseParam = config.database || defaultDB;
          var db = null;
          if (typeof databaseParam == 'object') {
            db = databaseParam;
          }
          else if (typeof databaseParam == 'string') {
            if (!databases[databaseParam]) {
              databases[databaseParam] = new pouch(databaseParam);
              if (vm.$pouch.gotAuth) login(databases[databaseParam]);
            }
            db = databases[databaseParam];
          }
          if (!db) return;
          if (liveFinds[key]) liveFinds[key].cancel()
          var aggregateCache = null
          liveFinds[key] = db.liveFind({
            selector: selector, 
            sort: sort,
            skip: skip,
            limit: limit,
            aggregate: true
          }).on('update', function(update, aggregate) {
            vm[key] = aggregateCache = aggregate;
          }).on('ready', function() {
            if (!aggregateCache) vm[key] = [];
          })
        }, {
          immediate: true
        })
      }   
    }
  }
  
  var api = {
    mixin: vuePouch,
    install: function (Vue, options) {
      vue = Vue;
      pouch = options.pouch || PouchDB;
      defaultDB = options.defaultDB;
      Vue.options = Vue.util.mergeOptions(Vue.options, vuePouch);
    }
  }

  if(typeof exports === 'object' && typeof module === 'object') {
    module.exports = api
  } else if(typeof define === 'function' && define.amd) {
    define(function () { return api })
  } else if (typeof window !== 'undefined') {
    window.VuePouch = api
  }
})()
