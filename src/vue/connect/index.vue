<template>
  <form @submit.prevent="tryConnect" class="connect-container">
    <header class="page-heading">
      <span class="eyebrow">DATABASE CLIENT</span>
      <h1>{{ editModel ? "Edit connection" : "New connection" }}</h1>
      <p>Choose a database, enter its details, and save it to your connection list.</p>
    </header>

    <blockquote class="p-3 mb-2 panel error" v-if="connect.error">
      <section class="panel__text">
        <div class="inline-block w-32 mr-5 font-bold">Connection error!</div>
        <span>{{ connect.errorMessage }}</span>
      </section>
    </blockquote>

    <blockquote class="p-3 mb-2 panel success" v-if="connect.success">
      <section class="panel__text">
        <div class="inline-block mr-5 font-bold w-36">Success!</div>
        <span>
          {{ connect.successMessage }}
        </span>
      </section>
    </blockquote>

    <section class="form-card">
      <div class="section-heading">
        <span class="section-number">01</span>
        <div><h2>Connection identity</h2><p>Name and organize this connection in the sidebar.</p></div>
      </div>
      <div class="field-grid">
      <div class="form-field">
        <label for="connection-name">Connection name</label>
        <input
          id="connection-name"
          class="field__input"
          placeholder="e.g. Production reporting"
          v-model="connectionOption.name"
        />
      </div>
      <div class="form-field">
        <label for="connection-package">Package</label>
        <input
          id="connection-package"
          class="field__input"
          placeholder="e.g. Work"
          required
          v-model.trim="connectionOption.packageName"
        />
        <small>Connections with the same package name appear in one sidebar folder.</small>
      </div>
      <div class="form-field scope-field">
        <span class="field-label">Save in</span>
        <div class="scope-options">
          <el-radio v-model="connectionOption.global" :label="true">All workspaces</el-radio>
          <el-radio v-model="connectionOption.global" :label="false">Current workspace</el-radio>
        </div>
      </div>
      </div>
    </section>

    <section class="form-card">
      <div class="section-heading">
        <span class="section-number">02</span>
        <div><h2>Database type</h2><p>Select the server or file you want to connect to.</p></div>
      </div>
      <ul class="database-types" aria-label="Database type">
        <li
          class="database-type"
          :class="{ 'database-type--active': supportDatabase == connectionOption.dbType }"
          v-for="supportDatabase in supportDatabases"
          :key="supportDatabase"
          @click="connectionOption.dbType = supportDatabase"
          @keydown.enter.prevent="connectionOption.dbType = supportDatabase"
          @keydown.space.prevent="connectionOption.dbType = supportDatabase"
          role="button"
          :tabindex="0"
          :aria-pressed="supportDatabase == connectionOption.dbType"
        >
          {{ supportDatabase === "SqlServer" ? "SQL Server (MSSQL)" : supportDatabase }}
        </li>
      </ul>
    </section>

    <section class="form-card details-card">
      <div class="section-heading">
        <span class="section-number">03</span>
        <div><h2>Connection details</h2><p>Set the address, credentials, and options for {{ connectionOption.dbType === "SqlServer" ? "SQL Server" : connectionOption.dbType }}.</p></div>
      </div>
    <ElasticSearch v-if="connectionOption.dbType == 'ElasticSearch'" :connectionOption="connectionOption" />
    <SQLite
      v-else-if="connectionOption.dbType == 'SQLite'"
      :connectionOption="connectionOption"
      :sqliteState="sqliteState"
      @choose="choose('sqlite')"
      @installSqlite="installSqlite"
    />
    <SSH
      v-else-if="connectionOption.dbType == 'SSH'"
      :connectionOption="connectionOption"
      @choose="choose('privateKey')"
    />

    <template v-else>
      <section class="mt-5">
        <div class="inline-block mb-2 mr-10" v-if="connectionOption.dbType != 'Redis' || !connectionOption.socketPath">
          <label class="inline-block w-32 mr-5 font-bold">
            <span>Host</span>
            <span class="mr-1 text-red-600" title="required" v-if="connectionOption.dbType != 'Redis'">*</span>
          </label>
          <input
            class="w-64 field__input"
            placeholder="The host of connection"
            :required="connectionOption.dbType != 'Redis'"
            v-model="connectionOption.host"
          />
        </div>
        <div class="inline-block mb-2 mr-10" v-if="connectionOption.dbType != 'Redis' || !connectionOption.socketPath">
          <label class="inline-block w-32 mr-5 font-bold">
            Port
            <span class="mr-1 text-red-600" title="required" v-if="connectionOption.dbType != 'Redis'">*</span>
          </label>
          <input
            class="w-64 field__input"
            placeholder="The port of connection"
            :required="connectionOption.dbType != 'Redis'"
            type="number"
            v-model="connectionOption.port"
          />
        </div>
        <div class="inline-block mb-2 mr-10" v-if="connectionOption.dbType == 'Redis'">
          <label class="inline-block w-32 mr-5 font-bold">Socket Path</label>
          <input
            class="w-64 field__input"
            placeholder="/tmp/redis.sock (optional)"
            v-model="connectionOption.socketPath"
          />
        </div>
      </section>

      <SQLServer :connectionOption="connectionOption" v-if="connectionOption.dbType == 'SqlServer'" />

      <section>
        <div class="inline-block mb-2 mr-10" v-if="connectionOption.dbType != 'Redis'">
          <label class="inline-block w-32 mr-5 font-bold">
            Username
            <span class="mr-1 text-red-600" title="required">*</span>
          </label>
          <input class="w-64 field__input" placeholder="Username" required v-model="connectionOption.user" />
        </div>
        <div class="inline-block mb-2 mr-10">
          <label class="inline-block w-32 mr-5 font-bold">Password</label>
          <input class="w-64 field__input" placeholder="Password" type="password" v-model="connectionOption.password" />
        </div>
      </section>

      <section v-if="connectionOption.dbType != 'FTP' && connectionOption.dbType != 'MongoDB'">
        <div class="inline-block mb-2 mr-10">
          <label class="inline-block w-32 mr-5 font-bold">Databases</label>
          <input
            class="w-64 field__input"
            placeholder="Special connection database"
            v-model="connectionOption.database"
          />
        </div>
        <div class="inline-block mb-2 mr-10" v-if="connectionOption.dbType != 'Redis'">
          <label class="inline-block w-32 mr-5 font-bold">Include Databases</label>
          <input
            class="w-64 field__input"
            placeholder="Example: mysql,information_schema"
            v-model="connectionOption.includeDatabases"
          />
        </div>
      </section>

      <FTP v-if="connectionOption.dbType == 'FTP'" :connectionOption="connectionOption" />

      <section>
        <div class="inline-block mb-2 mr-10">
          <label class="inline-block w-32 mr-5 font-bold">Connection Timeout</label>
          <input class="w-64 field__input" placeholder="5000" v-model="connectionOption.connectTimeout" />
        </div>
        <div class="inline-block mb-2 mr-10">
          <label class="inline-block w-32 mr-5 font-bold">Request Timeout</label>
          <input
            class="w-64 field__input"
            placeholder="10000"
            type="number"
            v-model="connectionOption.requestTimeout"
          />
        </div>
      </section>

      <section class="flex items-center mb-2" v-if="connectionOption.dbType == 'MySQL'">
        <div class="inline-block mb-2 mr-10">
          <label class="inline-block w-32 mr-5 font-bold">Timezone</label>
          <input class="w-64 field__input" placeholder="+HH:MM" v-model="connectionOption.timezone" />
        </div>
      </section>
    </template>

    <section class="flex items-center">
      <div
        class="inline-block mb-2 mr-10"
        v-if="connectionOption.dbType != 'SSH' && connectionOption.dbType != 'SQLite'"
      >
        <label class="mr-2 font-bold">SSH Tunnel</label>
        <el-switch v-model="connectionOption.usingSSH"></el-switch>
      </div>
      <div
        class="inline-block mb-2 mr-10"
        v-if="
          connectionOption.dbType == 'MySQL' ||
          connectionOption.dbType == 'PostgreSQL' ||
          connectionOption.dbType == 'MongoDB' ||
          connectionOption.dbType == 'Redis'
        "
      >
        <label class="inline-block mr-5 font-bold w-18">Use SSL</label>
        <el-switch v-model="connectionOption.useSSL"></el-switch>
      </div>
      <div class="inline-block mb-2 mr-10" v-if="connectionOption.dbType === 'MongoDB'">
        <label class="inline-block mr-5 font-bold w-18">SRV Record</label>
        <el-switch v-model="connectionOption.srv"></el-switch>
      </div>
      <div class="inline-block mb-2 mr-10" v-if="connectionOption.dbType === 'MongoDB'">
        <label class="inline-block mr-5 font-bold w-18">Use Connection String</label>
        <el-switch v-model="connectionOption.useConnectionString"></el-switch>
      </div>
    </section>
    <section class="flex items-center" v-if="connectionOption.useConnectionString">
      <div class="flex w-full mb-2 mr-10">
        <label class="inline-block w-32 mr-5 font-bold">Connection String</label>
        <input
          class="w-4/5 field__input"
          placeholder="e.g mongodb+srv://username:password@server-url/admin"
          v-model="connectionOption.connectionUrl"
        />
      </div>
    </section>

    <SSL
      :connectionOption="connectionOption"
      v-if="
        connectionOption.useSSL &&
        ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'ElasticSearch'].includes(connectionOption.dbType)
      "
    />
    <SSH :connectionOption="connectionOption" v-if="connectionOption.usingSSH && connectionOption.dbType != 'SSH'" />

    </section>

    <div class="form-actions">
      <span>Connection details are saved when you connect.</span>
      <div class="action-buttons">
        <button class="button button--secondary" type="button" @click="close">Close</button>
        <button class="button button--primary" type="submit" v-loading="connect.loading">Connect</button>
      </div>
    </div>
  </form>
</template>

<script>
import ElasticSearch from "./component/ElasticSearch.vue";
import SQLite from "./component/SQLite.vue";
import SQLServer from "./component/SQLServer.vue";
import SSH from "./component/SSH.vue";
import FTP from "./component/FTP.vue";
import SSL from "./component/SSL.vue";
import { getVscodeEvent } from "../util/vscode";
let vscodeEvent;
function createDefaultConnectionOption() {
  return {
    host: "127.0.0.1",
    dbPath: "",
    port: "3306",
    user: "root",
    authType: "default",
    password: "",
    encoding: "utf8",
    database: null,
    usingSSH: false,
    showHidden: false,
    includeDatabases: null,
    dbType: "MySQL",
    encrypt: true,
    connectionUrl: "",
    socketPath: "",
    srv: false,
    esAuth: "none",
    global: true,
    key: null,
    packageName: "Default",
    timezone: "+00:00",
    ssh: {
      host: "",
      privateKeyPath: "",
      port: 22,
      username: "root",
      type: "password",
      watingTime: 5000,
      algorithms: { cipher: [] },
    },
  };
}
export default {
  name: "Connect",
  components: { ElasticSearch, SQLite, SQLServer, SSH, SSL, FTP },
  data() {
    return {
      connectionOption: createDefaultConnectionOption(),
      sqliteState: false,
      type: "password",
      supportDatabases: [
        "MySQL",
        "PostgreSQL",
        "SqlServer",
        "SQLite",
        "MongoDB",
        "Redis",
        "ElasticSearch",
        "SSH",
        "FTP",
        "Exasol"
      ],
      connect: {
        loading: false,
        success: false,
        successMessage: "",
        error: false,
        errorMessage: "",
      },
      editModel: false,
    };
  },
  mounted() {
    vscodeEvent = getVscodeEvent();
    vscodeEvent
      .on("edit", (node) => {
        this.editModel = true;
        this.connectionOption = node;
        this.connectionOption.packageName = node.packageName || "Default";
      })
      .on("connect", (node) => {
        this.editModel = false;
        this.connectionOption = createDefaultConnectionOption();
        this.connect.loading = false;
        this.connect.success = false;
        this.connect.error = false;
      })
      .on("choose", ({ event, path }) => {
        switch (event) {
          case "sqlite":
            this.connectionOption.dbPath = path;
            break;
          case "privateKey":
            this.connectionOption.ssh.privateKeyPath = path;
            break;
        }
        this.$forceUpdate();
      })
      .on("sqliteState", (sqliteState) => {
        this.sqliteState = sqliteState;
      })
      .on("error", (err) => {
        this.connect.loading = false;
        this.connect.success = false;
        this.connect.error = true;
        this.connect.errorMessage = err;
      })
      .on("saved", (res) => {
        if (this.editModel) {
          this.connectionOption.connectionKey = res.connectionKey;
          this.connectionOption.key = res.key;
        } else {
          this.connectionOption = createDefaultConnectionOption();
        }
      })
      .on("success", (res) => {
        this.connect.loading = false;
        this.connect.error = false;
        this.connect.success = true;
        this.connect.successMessage = res.message;
        if (!this.editModel) {
          this.connectionOption = createDefaultConnectionOption();
        }
      });
    vscodeEvent.emit("route-" + this.$route.name);
  },
  destroyed() {
    vscodeEvent.destroy();
  },
  methods: {
    installSqlite() {
      vscodeEvent.emit("installSqlite");
      this.sqliteState = true;
    },
    tryConnect() {
      if (this.connect.loading) return;
      this.connect.loading = true;
      vscodeEvent.emit("connecting", {
        connectionOption: this.connectionOption,
      });
    },
    choose(event) {
      let filters = {};
      switch (event) {
        case "sqlite":
          filters["SQLiteDb"] = ["db"];
          break;
        case "privateKey":
          filters["PrivateKey"] = ["key", "cer", "crt", "der", "pub", "pem", "pk"];
          break;
      }
      filters["File"] = ["*"];
      vscodeEvent.emit("choose", {
        event,
        filters,
      });
    },
    close() {
      vscodeEvent.emit("close");
    },
  },
  watch: {
    "connectionOption.dbType"(value) {
      if (this.editModel) {
        return;
      }
      this.connectionOption.host = "127.0.0.1";
      switch (value) {
        case "MySQL":
          this.connectionOption.user = "root";
          this.connectionOption.port = 3306;
          this.connectionOption.database = null;
          break;
        case "PostgreSQL":
          this.connectionOption.user = "postgres";
          this.connectionOption.encrypt = false;
          this.connectionOption.port = 5432;
          this.connectionOption.database = "postgres";
          break;
        case "Oracle":
          this.connectionOption.user = "system";
          this.connectionOption.port = 1521;
          break;
        case "SqlServer":
          this.connectionOption.user = "sa";
          this.connectionOption.encrypt = true;
          this.connectionOption.port = 1433;
          this.connectionOption.database = "master";
          break;
        case "ElasticSearch":
          this.connectionOption.host = "127.0.0.1:9200";
          this.connectionOption.user = null;
          this.connectionOption.port = null;
          this.connectionOption.database = null;
          break;
        case "Redis":
          this.connectionOption.port = 6379;
          this.connectionOption.user = null;
          this.connectionOption.database = "0";
          break;
        case "MongoDB":
          this.connectionOption.user = null;
          this.connectionOption.password = null;
          this.connectionOption.port = 27017;
          break;
        case "FTP":
          this.connectionOption.port = 21;
          this.connectionOption.user = null;
          break;
        case "SSH":
          break;
        case "Exasol":
          this.connectionOption.user = "sys";
          this.connectionOption.port = 8563;
          this.connectionOption.database = null;
          break;
      }
      this.$forceUpdate();
    },
    "connectionOption.connectionUrl"(value) {
      let connectionUrl = this.connectionOption.connectionUrl;

      const srvRegex = /(?<=mongodb\+).+?(?=:\/\/)/;
      const srv = connectionUrl.match(srvRegex);
      if (srv) {
        this.connectionOption.srv = true;
        connectionUrl = connectionUrl.replace(srvRegex, "");
      }
      const userRegex = /(?<=\/\/).+?(?=\:)/;
      const user = connectionUrl.match(userRegex);
      if (user) {
        this.connectionOption.user = user[0];
        connectionUrl = connectionUrl.replace(userRegex, "");
      }
      const passwordRegex = /(?<=\/\/:).+?(?=@)/;
      const password = connectionUrl.match(passwordRegex);
      if (password) {
        this.connectionOption.password = password[0];
        connectionUrl = connectionUrl.replace(passwordRegex, "");
      }

      const hostRegex = /(?<=@).+?(?=[:\/])/;
      const host = connectionUrl.match(hostRegex);
      if (host) {
        this.connectionOption.host = host[0];
        connectionUrl = connectionUrl.replace(hostRegex, "");
      }

      if (!this.connectionOption.srv) {
        const portRegex = /(?<=\:).\d+/;
        const port = connectionUrl.match(portRegex);
        if (port) {
          this.connectionOption.port = port[0];
          connectionUrl = connectionUrl.replace(portRegex, "");
        }
      }

      this.$forceUpdate();
    },
  },
};
</script>

<style scoped>
.connect-container {
  width: 100%;
  max-width: 1050px;
  margin: 0 auto;
  padding: 28px 24px 36px;
  color: var(--vscode-foreground);
}

.page-heading {
  margin-bottom: 24px;
}

.eyebrow {
  color: var(--vscode-descriptionForeground);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .12em;
}

.page-heading h1 {
  margin: 5px 0;
  font-size: 24px;
  font-weight: 600;
}

.page-heading p,
.section-heading p,
.form-field small,
.form-actions > span {
  color: var(--vscode-descriptionForeground);
  font-size: 12px;
}

.form-card {
  margin-bottom: 16px;
  padding: 20px 22px;
  border: 1px solid var(--vscode-panel-border, var(--vscode-dropdown-border));
  border-radius: 8px;
  background: var(--vscode-sideBar-background, var(--vscode-editor-background));
}

.section-heading {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;
}

.section-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex: none;
  border-radius: 7px;
  background: var(--vscode-badge-background);
  color: var(--vscode-badge-foreground);
  font-size: 11px;
  font-weight: 700;
}

.section-heading h2 {
  margin: 1px 0 3px;
  font-size: 15px;
  font-weight: 600;
}

.section-heading p {
  margin: 0;
}

.field-grid,
.details-card > section,
.details-card > template > section,
.details-card >>> section {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 20px;
}

.form-field {
  min-width: 0;
}

.form-field label,
.field-label,
.details-card >>> label {
  display: block;
  width: auto;
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 600;
}

.form-field small {
  display: block;
  margin-top: 6px;
}

.scope-field {
  grid-column: 1 / -1;
}

.scope-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  padding-top: 4px;
}

.database-types {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
}

.database-type {
  list-style: none;
  cursor: pointer;
  padding: 8px 12px;
  border: 1px solid var(--vscode-dropdown-border, var(--vscode-panel-border));
  border-radius: 6px;
  background: var(--vscode-editor-background);
  font-size: 12px;
  line-height: 1.3;
}

.database-type:hover,
.database-type:focus-visible {
  border-color: var(--vscode-focusBorder);
  outline: none;
}

.database-type--active {
  border-color: var(--vscode-focusBorder);
  background: var(--vscode-list-activeSelectionBackground);
  color: var(--vscode-list-activeSelectionForeground);
}

.details-card > section,
.details-card >>> section {
  margin: 0 0 14px;
}

.details-card > section > div,
.details-card >>> section > div {
  min-width: 0;
  width: 100%;
  margin: 0;
}

.connect-container .field__input,
.details-card >>> .field__input,
.details-card >>> .el-select {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  min-height: 30px;
  padding: 5px 9px;
  color: var(--vscode-input-foreground);
  background: var(--vscode-input-background);
  border: 1px solid var(--vscode-input-border, var(--vscode-dropdown-border));
  border-radius: 4px;
}

.details-card >>> .el-select {
  padding: 0;
}

.connect-container .field__input:focus,
.details-card >>> .field__input:focus {
  outline: 1px solid var(--vscode-focusBorder);
  border-color: var(--vscode-focusBorder);
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 4px 0;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.button {
  min-width: 92px;
  padding: 7px 14px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
}

.button--primary {
  color: var(--vscode-button-foreground);
  background-color: var(--vscode-button-background);
}

.button--primary:hover {
  background-color: var(--vscode-button-hoverBackground);
}

.button--secondary {
  color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
  background: var(--vscode-button-secondaryBackground, var(--vscode-editor-background));
}

.button--secondary:hover {
  background: var(--vscode-button-secondaryHoverBackground, var(--vscode-list-hoverBackground));
}

.panel {
  border-left-width: 5px;
  border-left-style: solid;
  background: var(--vscode-textBlockQuote-background);
}

.error {
  border-color: var(--vscode-inputValidation-errorBorder);
}

.success {
  border-color: green;
}

.panel__text {
  line-height: 2;
}

@media (max-width: 700px) {
  .connect-container { padding: 20px 14px 28px; }
  .form-card { padding: 16px; }
  .field-grid,
  .details-card > section,
  .details-card >>> section { grid-template-columns: minmax(0, 1fr); }
}
</style>
