(function () {
  var vue = null;
  var pouch = null;
  var defaultDB = null;
  var databases = {};
  var pouchdbvue = {
    created: function() {
      if (!vue) {
        console.warn('[pouchdb-vue] not installed!')
        return
      }
      var defineReactive = vue.util.defineReactive;
      var vm = this;
      var pouchOptions = this.$options.pouch;
      if (!pouchOptions) return;
      if (typeof pouchOptions == 'function') pouchOptions = pouchOptions();
      var liveFinds = {};
      for (var key in pouchOptions) {
        if (!pouchOptions.hasOwnProperty(key)) return;
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
            if (!databases[databaseParam]) databases[databaseParam] = new pouch(databaseParam);
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
    mixin: pouchdbvue,
    install: function (Vue, options) {
      vue = Vue;
      pouch = options.pouch || PouchDB;
      defaultDB = options.defaultDB;
      Vue.options = Vue.util.mergeOptions(Vue.options, pouchdbvue);
    }
  }

  if(typeof exports === 'object' && typeof module === 'object') {
    module.exports = api
  } else if(typeof define === 'function' && define.amd) {
    define(function () { return api })
  } else if (typeof window !== 'undefined') {
    window.PouchDBVue = api
  }
})()
