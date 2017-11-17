(function () {
  var vue = null;
  var pouch = null;
  var defaultDB = null;
  var defaultUsername = null;
  var defaultPassword = null;
  var databases = {};
  
  var vuePouch = {
    destroyed: function() {
      Object.values(this._liveFinds).map(function(lf) { lf.cancel(); });
    },
    created: function() {
      if (!vue) {
        console.warn('[vue-pouch] not installed!')
        return
      }
      var defineReactive = vue.util.defineReactive;
      var vm = this;
      vm._liveFinds = {};
      
      function fetchSession(database) {
        if (['http','https'].indexOf(database.adapter) == -1) return;
        database.getSession().then(function(res) {
          return database.getUser(res.userCtx.name).then(function(res) {
            vm.$pouch.session = res;
          })
        }).catch(function(error) {
          vm.$pouch.authError = error
        });
      }
      function login(database) {
        if (['http','https'].indexOf(database.adapter) == -1) return;
        database.login(defaultUsername, defaultPassword).then(function(res) {
          vm.$pouch.session = res;
          return database.getUser(defaultUsername).then(function(res) {
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
          var numPaused = 0;
          vm.$pouch.loading[localDB] = true
          // defineReactive(vm, '$pouch.ready', vm.$pouch.ready)
          return pouch.sync(databases[localDB], databases[remoteDB], options)
          .on('paused', function (err) {
            if (err) {
              vm.$pouch.errors[localDB] = err
              vm.$pouch.errors = Object.assign({}, vm.$pouch.errors)  
              return;
            }
            numPaused += 1;
            if (numPaused >= 2) {
              vm.$pouch.loading[localDB] = false
              vm.$pouch.loading = Object.assign({}, vm.$pouch.loading)
            }
          })
          .on('active', function () {
            // console.log('active callback')
          })
          .on('denied', function (err) {
            vm.$pouch.errors[localDB] = err
            vm.$pouch.errors = Object.assign({}, vm.$pouch.errors)
            // console.log('denied callback')
          })
          .on('complete', function (info) {
            // console.log('complete callback')
          })
          .on('error', function (err) {
            vm.$pouch.errors[localDB] = err
            vm.$pouch.errors = Object.assign({}, vm.$pouch.errors)
          })
          
          fetchSession(databases[remoteDB]);
        },
        push: function(localDB, remoteDB, options) {
          if (!databases[localDB])  databases[localDB] = new pouch(localDB);
          if (!databases[remoteDB]) databases[remoteDB] = new pouch(remoteDB);
          if (!defaultDB) defaultDB = databases[remoteDB];
          fetchSession(databases[remoteDB]);
          return databases[localDB].replicate.to(databases[remoteDB], options)
          .on('paused', function (err) {
            // console.log('paused callback')
          })
          .on('active', function () {
            // console.log('active callback')
          })
          .on('denied', function (err) {
            vm.$pouch.errors[localDB] = err
            vm.$pouch.errors = Object.assign({}, vm.$pouch.errors)
            // console.log('denied callback')
          })
          .on('complete', function (info) {
            // console.log('complete callback')
          })
          .on('error', function (err) {
            vm.$pouch.errors[localDB] = err
            vm.$pouch.errors = Object.assign({}, vm.$pouch.errors)
            // console.log('error callback')
          })
        },
        put: function(db, object, options) {
          return databases[db].put(object, options || {});
        },
        post: function(db, object, options) {
          return databases[db].post(object, options || {});
        },
        remove: function(db, object, options) {
          return databases[db].remove(object, options || {});
        },
        get: function(db, object, options) {
          return databases[db].get(object, options || {});
        },
        session: {},
        errors: {},
        loading: {},
        authError: null,
        gotAuth: false
      }
      defineReactive(vm, '$pouch', $pouch);
      vm.$databases = databases; // Add non-reactive property
      
      var pouchOptions = this.$options.pouch;
      if (!pouchOptions) return;
      if (typeof pouchOptions == 'function') pouchOptions = pouchOptions();
      Object.keys(pouchOptions).map(function(key) {
        var pouchFn = pouchOptions[key];
        if (typeof pouchFn !== 'function') {
          pouchFn = function() {
            return pouchOptions[key];
          }    
        }
        if (typeof vm.$data[key] == 'undefined') vm.$data[key] = null;
        defineReactive(vm, key, null);
        vm.$watch(pouchFn, function(config) {
          if (!config) {
            if (!vm[key]) vm[key] = []
            return;
          }
          var selector, sort, skip, limit, first;
          if (config.selector) {
            selector = config.selector;
            sort = config.sort;
            skip = config.skip;
            limit = config.limit;
            first = config.first;
          }
          else {
            selector = config
          }
          var databaseParam = config.database || key;
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
          if (vm._liveFinds[key]) vm._liveFinds[key].cancel()
          var aggregateCache = []
          vm._liveFinds[key] = db.liveFind({
            selector: selector, 
            sort: sort,
            skip: skip,
            limit: limit,
            aggregate: true
          }).on('update', function(update, aggregate) {
            if (first && aggregate) aggregate = aggregate[0]
            vm[key] = aggregateCache = aggregate;
          }).on('ready', function() {
            vm[key] = aggregateCache;
          })
        }, {
          immediate: true
        })
      })
    }
  }
  
  function installSelectorReplicationPlugin() {
    // This plugin enables selector-based replication
    pouch.plugin(function(pouch) {
      var oldReplicate = pouch.replicate
      pouch.replicate = function(source, target, repOptions) {
        var sourceAjax = source._ajax
        source._ajax = function(ajaxOps, callback) {
          if (ajaxOps.url.includes('_selector')) {
            ajaxOps.url = ajaxOps.url.replace('filter=_selector%2F_selector', 'filter=_selector')
            ajaxOps.method = 'POST'
            ajaxOps.body = {
              selector: repOptions.selector
            }
          }
          return sourceAjax(ajaxOps, callback)
        }
        return oldReplicate(source, target, repOptions)
      }
    })
  }
  
  var api = {
    mixin: vuePouch,
    install: function (Vue, options) {
      vue = Vue;
      pouch = (options && options.pouch) || PouchDB;
      installSelectorReplicationPlugin()
      defaultDB = (options && options.defaultDB);
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
