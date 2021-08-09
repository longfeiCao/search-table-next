import searchTable from "./search-table/index.vue"
console.log(searchTable);
searchTable.install = function(Vue) {
    Vue.component(searchTable.name, searchTable);
};
  
export default searchTable;