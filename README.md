# vue-pouch 👌👌👌

PouchDB integration for Vuejs with live and reactive **[Mango Queries](http://docs.couchdb.org/en/2.0.0/api/database/find.html)**, **Remote Syncing**, and **Authentication**. It's all you need to build the next awesome PWA.

![If you have Pouch and Vue, you have Pouch and Vue](https://github.com/QurateInc/vue-pouch/blob/master/vue-pouch.png)

> "The Couch is the Source of Truth." - Somebody

Refer to https://github.com/nolanlawson/pouchdb-find for documentation on the query structure and a guide on how to create indexes.

## Examples

### Live and reactive Mango Queries

```vue
<template>
  Show people that are <input v-model="age"> years old.
  <div v-for="person in people">
    {{ person.name }}
  </div>
</template>

<script>
  export default {
    data () {
      return {
        resultsPerPage: 25,
        currentPage: 1
      }
    },
    // Use the pouch property to configure the component to (reactively) read data from pouchdb.
    pouch: {
      // The function returns a Mango-like selector that is run against a pre-configured default database.
      // The result of the query is assigned to the `people` property.
      people: function() {
        if (!this.age) return;
        return {age: this.age, type: "person"}
      },
      // You can also specify the database dynamically (local or remote), as well as limits, skip and sort order:
      peopleInOtherDatabase: function() {
        return {
          database: this.selectedDatabase, // you can pass a database string or a pouchdb instance
          selector: {type: "person"},
          sort: [{name: "asc"}],
          limit: this.resultsPerPage,
          skip: this.resultsPerPage * (this.currentPage - 1)
        }
      }
    }
  })
</script>
```

### User Authentication

```vue
<template>
  <div class="credentials">
    <button v-if="$pouch.hasAuth" @click="$pouch.resetAuth()">Reset Authentication</button>
    <button v-else @click="$pouch.useAuth('myname', 'mypassword')">Authenticate</button>
    <button @click="$pouch.createUser('myname', 'mypassword')">Create User</button>
    Your remote session name: {{ $pouch.session.name }}
    <div class="error" v-if="$pouch.error">There was an error: {{ $pouch.error }}</div>
  </div>
</template>
```

### Remote Syncing

```vue
<template>
  <div class="credentials">
    <div class="error" v-if="$pouch.error.blog">{{ $pouch.error.blog }}</div>
  </div>
</template>

<script>
export default {
  created: function() {
    // This will set up a live sync
    this.$pouch.sync('blog', 'remotehost/blog')
  }
}
</script>
```


## Installation

Install via npm:

    npm install --save vue-pouch

The only requirement is that `pouchdb-live-find` is installed:

    let PouchDB = require('pouchdb-browser');
    PouchDB.plugin(require('pouchdb-find'));
    PouchDB.plugin(require('pouchdb-live-find'));
    
If you want to use remote databases (CouchDB, Cloudant, etc.), you should also install the authentication plugin:

    PouchDB.plugin(require('pouchdb-authentication'));
    
Then, plug VuePouch into Vue:

    Vue.use(require('vue-pouch'), {
      pouch: PouchDB,    // optional if `PouchDB` is available on the global object
    })

## API

When using VuePouch, don't use `new PouchDB(...)`, `db.login` or `db.sync` directly, since VuePouch needs to hook into their callbacks. Instead, use the functions provided by the `$pouch` property on your vue instance.

### $pouch

In theory, VuePouch can handle multiple remote servers at the same time. However,
all user authentication and session management is done on the **first** http/https
database that has been configured using the `$pouch.sync` method.

#### Methods

* `$pouch.sync(localDatabase, remoteDatabase)`: Sets up a remote database. Also, if the browser has an active session cookie, it will fetch session data (username, etc) from the remote server.
* `$pouch.createUser(name, password)`: Create a user in the remote database and also start a new session.
* `$pouch.useAuth(name, password)`: Set credentials to use to start a session with the remote server.
* `$pouch.resetAuth()`: Forgets the credentials, session data and session cookie.

#### Reactive Properties

* `$pouch.hasAuth`: `true`, if VuePouch has credentials
* `$pouch.authError`: Contains the authentication error, if one occured (eg. when calling useAuth, createUser, etc).
* `$pouch.session`: Contains information about the current session with the remote database (eg. user name, roles, etc.)
* `$pouch.errors`: A json object containing errors that occured on databases. The object key is the name of the database, the value is the error.

## Todo

These things are on the list to be doped out at a later time.

* [ ] Lazy (on-demand) attachments
* [ ] Resumable uploads
* [ ] Conflict handling after offline changes
* [ ] Way to handle sync errors (no connection, auth errors, ..) in reactive way
* [ ] Change username/password, store user meta info
* [ ] Two-factor auth
* [ ] Third-party auth
