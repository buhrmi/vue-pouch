// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import PouchDB from 'pouchdb-browser'
import lf from 'pouchdb-find'
import plf from 'pouchdb-live-find'

Vue.config.productionTip = false

PouchDB.plugin(lf)
PouchDB.plugin(plf)

Vue.use(require('vue-pouch'), {
  pouch: PouchDB,
  defaultDB: 'config'
})


/* eslint-disable no-new */
new Vue({
  el: '#app',
  template: '<App/>',
  components: { App }
})
