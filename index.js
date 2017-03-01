(function () {
  let vue;
  let databases = {};
  let pouchdbvue = {
    created: function() {
      if (!vue) {
        console.warn('[pouchdb-vue] not installed!')
        return
      }
      const { defineReactive } = vue.util;
      let vm = this;
      let pouchOptions = this.$options.pouch;
      if (!pouchOptions) return;
      if (typeof pouchOptions == 'function') pouchOptions = pouchOptions();
      for (let key in pouchOptions) {
        let liveFind;
        if (!pouchOptions.hasOwnProperty(key)) return;
        let pouchFn = pouchOptions[key]
        this.$data[key] = null;
        defineReactive(this, key, null);

        this.$watch(pouchFn, function(config) {
          if (!config) {
            vm[key] = []
            return;
          }
          let selector, sort, skip, limit;
          if (config.selector) {
            selector = config.selector;
            sort: config.sort;
            skip: config.skip;
            limit: config.limit;
          }
          else {
            selector = config
          }
          let databaseParam = config.database || api.defaults.database;
          let db;
          if (typeof databaseParam == 'object') {
            db = databaseParam;
          }
          else {
            if (!databases[databaseParam]) databases[databaseParam] = new PouchDB(databaseParam);
            db = databases[databaseParam];
          }
          if (liveFind) liveFind.cancel()
          let aggregateCache = null
          liveFind = db.liveFind({
            selector, sort, skip, limit, aggregate: true
          }).on('update', function(update, aggregate) {
            vm[key] = aggregateCache = aggregate;
          }).on('ready', function() {
            if (!aggregateCache) vm[key] = [];
          })
        })
      }   
      
    }
  }

  
  let api = {
    mixin: pouchdbvue,
    defaults: {},
    install: function (Vue, options) {
      vue = Vue
      Vue.options = Vue.util.mergeOptions(Vue.options, pouchdbvue)
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
