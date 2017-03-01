(function () {
  var vue;
  
  var pouchdbvue = {
    created: function() {
      if (!vue) {
        console.warn('[pouchdb-vue] not installed!')
        return
      }
      const { defineReactive } = vue.util;
      let vm = this;
      let pouchOptions = this.$options.pouch;
      if (!pouchOptions) return;
      let databases = {};
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
          let databaseName = config.database || api.defaults.database;
          if (!databases[databaseName]) databases[databaseName] = new PouchDB(databaseName);
          let db = databases[databaseName];
          if (liveFind) liveFind.cancel()
          liveFind = db.liveFind({
            selector, sort, skip, limit, aggregate: true
          }).on('update', function(update, aggregate) {
            vm[key] = aggregate;
          })
        })
      }   
      
    }
  }

  
  var api = {
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
