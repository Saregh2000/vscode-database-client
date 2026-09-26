<template>
  <div class="toolbar">
    <div class="toolbar-actions">
      <el-input
        v-model="searchInput"
        class="toolbar-search"
        size="small"
        placeholder="Search visible rows"
        prefix-icon="el-icon-search"
        :clearable="true"
        aria-label="Search visible rows"
      />
      <div class="action-group">
        <el-button v-if="showFullBtn" @click="$emit('sendToVscode', 'full')" icon="el-icon-rank" size="small" title="Full result view" aria-label="Full result view" />
        <el-button @click="$emit('insert')" icon="el-icon-circle-plus-outline" size="small" title="Insert new row" aria-label="Insert new row" />
        <el-button @click="$emit('deleteConfirm')" icon="el-icon-delete" size="small" title="Delete selected rows" aria-label="Delete selected rows" />
        <el-button @click="$emit('export')" icon="el-icon-download" size="small" title="Export results" aria-label="Export results" />
      </div>
    </div>
    <div class="toolbar-meta">
      <span class="query-time" :title="'Query completed in ' + costTime + ' ms'">{{ costTime }} ms</span>
      <el-pagination
        @current-change="page => $emit('changePage', page, true)"
        @next-click="() => $emit('changePage', 1)"
        @prev-click="() => $emit('changePage', -1)"
        :current-page.sync="page.pageNum"
        :small="true"
        :page-size="page.pageSize"
        :layout="page.total != null ? 'prev,pager,next,total' : 'prev,next'"
        :total="page.total"
      />
      <el-button @click="$emit('sendToVscode', 'openGithub')" icon="icon-github" size="small" title="Project on GitHub" aria-label="Project on GitHub" />
    </div>
  </div>
</template>

<script>
export default {
  props: ["costTime", "search", "showFullBtn", "page"],
  data() {
    return { searchInput: this.search || "" };
  },
  watch: {
    searchInput(value) {
      this.$emit("update:search", value);
    },
    search(value) {
      if (value !== this.searchInput) this.searchInput = value;
    },
  },
};
</script>

<style scoped>
.toolbar,
.toolbar-actions,
.toolbar-meta,
.action-group {
  display: flex;
  align-items: center;
}

.toolbar {
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px 18px;
  min-height: 42px;
}

.toolbar-actions,
.toolbar-meta { flex-wrap: wrap; gap: 8px; }
.action-group { gap: 5px; }
.toolbar-search { width: min(250px, 100%); }
.query-time {
  color: var(--vscode-descriptionForeground);
  font-size: 12px;
  white-space: nowrap;
}

.toolbar >>> .el-button {
  margin: 0;
  padding: 7px 9px;
  color: var(--vscode-foreground);
  border-color: var(--vscode-panel-border, var(--vscode-dropdown-border));
  background: var(--vscode-editor-background);
}

.toolbar >>> .el-button:hover,
.toolbar >>> .el-button:focus {
  color: var(--vscode-button-foreground);
  border-color: var(--vscode-focusBorder);
  background: var(--vscode-button-background);
}

.toolbar >>> .el-input__inner {
  color: var(--vscode-input-foreground);
  background: var(--vscode-input-background);
  border-color: var(--vscode-input-border, var(--vscode-dropdown-border));
}

.toolbar >>> .el-pagination,
.toolbar >>> .el-pagination button,
.toolbar >>> .el-pager li {
  color: var(--vscode-foreground);
  background: transparent;
}

.toolbar >>> .el-pager li.active { color: var(--vscode-textLink-foreground); }

@media (max-width: 620px) {
  .toolbar,
  .toolbar-actions,
  .toolbar-meta { align-items: stretch; width: 100%; }
  .toolbar-search { width: 100%; }
}
</style>
