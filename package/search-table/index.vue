<template>
  <a-form :model="state.queryParams">
    <a-row :gutter="15" class="filter">
      <a-col class="item" v-for="item in filterForm" :key="item.value">
        <a-form-item label="" v-if="item.type == 'input'">
          <a-input v-model:value="state.queryParams[item.value]" :placeholder="`请输入${item.label}`" />
        </a-form-item>
        <a-form-item label="" v-if="item.type == 'select'">
          <a-select v-model:value="state.queryParams[item.value]" :placeholder="`请选择${item.label}`">
            <a-select-option v-for="option in item.options" :key="option.value" :value="option.value">
              {{option.text}}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="" v-if="item.type == 'date'">
          <a-date-picker v-model:value="state.queryParams[item.value]" valueFormat="YYYY-MM-DD" style="width:100%;" />
        </a-form-item>
        <a-form-item label="" v-if="item.type == 'daterange'">
          <a-range-picker v-model:value="state.queryParams[item.value]" valueFormat="YYYY-MM-DD" style="width:100%;" />
        </a-form-item>
      </a-col>
      <slot name="formItem"></slot>
      <!-- <a-col class="item" style="width:25%;">
        <a-form-item label="">
          <a-input-number style="width:100%;"></a-input-number>   
        </a-form-item>
     </a-col> -->
      <a-col class="btnItem mb10 text-right">
          <a-button type="primary" class="mr10" @click="search()">筛 选</a-button>
          <a-button type="ghost" @click="reset()">重 置</a-button>
      </a-col>
    </a-row>
  </a-form>
  <div class="mb10">
    <slot name="extra" />
  </div>
  <a-table
   :rowKey="selectionCfg.rowKey"
   :loading="state.tableLoading"
   :row-selection="showSelection ? selectionCfg : null"
   :columns="state.columns"
   :pagination="false"
   :data-source="state.tableData">
      <template #defaultAction={record}>
        <a-button type="primary" @click="handleEdit(record)">{{editText}}</a-button>
        <a-button style="margin-left:5px;" @click="handleDel(record)">{{delText}}</a-button>
      </template>
      <template v-for="colCustom in columnsCustom" :key="colCustom.customRender" v-slot:[colCustom.customRender]={record} >
        <slot :name="colCustom.customRender" :record="record"></slot>
      </template>
  </a-table>
  <div style="float:right;margin:10px 0;">
    <a-pagination
      show-size-changer
      v-model:current="state.pages.currentPage"
      v-model:pageSize="state.pages.pageSize"
      :total="state.total"
      @change="onChangeSize"
    />
  </div>
  
</template>
<script setup>
import { computed, defineProps, onMounted, reactive, ref, defineEmits, defineExpose,createVNode } from 'vue';
import { ExclamationCircleOutlined } from '@ant-design/icons-vue';
import {notification,Modal,Button,Table,Form,FormItem,Select,Input,Row,Col,DatePicker } from "ant-design-vue"
import useResultField from "./UseResultField"
import useQs from "./UseQs"

// import api from '@/api' //自己封装的接口api

const name = "searchTable"

const columnsCustom = computed(()=>{
    return state.columns.filter(item => {
      return item.slots && item.slots.customRender !=='defaultAction'
    }).map(item => item.slots)
})


const props = defineProps({
  // ...Table.props,
  apiFun:{         //自己定义的api接口方法名
    type:String,
    default:''
  },
  fetchOptions:{  // apiFun如果传值,fetchOptions将不会启用
    type:Object,
    default:{
      url:"",
      method:'get',
      headers:{}
    }
  },
  resultField:{
    type:String,
    default:'list'
  },
  totalField:{
    type:String,
    default:'total'
  },
  showSelection:{
    type:Boolean,
    default:false
  },
  editText:{
    type:String,
    default:'编辑'
  },
  delText:{
    type:String,
    default:'删除'
  },
  selectionCfg:{
    type:Object,
    default:{
      type:'checkbox',
      // onChange:(selectedRowKeys, selectedRows)=>{
      //   console.log(selectedRowKeys, selectedRows);
      // }
    }
  },
  propsParams:{
    type:Object,
    default:{}
  },
  filterForm:{
    type:Array,
    default:[
      // {
      //   label:'地点',
      //   type:'input',
      //   value:'test1'
      // },
      // {
      //   label:'城市',
      //   type:'select',
      //   value:'test2',
      //   options:[
      //     {
      //       value:'beijing',
      //       text:"北京"
      //     },
      //     {
      //       value:'shanghai',
      //       text:"上海"
      //     }
      //   ]
      // },
      // {
      //   label:'test1112',
      //   type:'date',
      //   value:'test3'
      // },
      // {
      //   label:'xxxx',
      //   type:'daterange',
      //   value:'test4'
      // }
    ]
  },
  columns:{
    type:Array,
    default:[
      // {
      //   title:'test',
      //   dataIndex: 'title',
      //   key: 'title',
      //   slots: {
      //       title: 'nameslot',
      //       customRender: 'name',
      //     },
      // }
    ]
  }
})

let state = reactive({
  total:10,
  pages:{
    currentPage: 1,
    pageSize: 10
  },
  queryParams:{},
  tableLoading: false,
  tableData:[],
  columns:[]
})

const onChangeSize = (page, pageSize)=>{
  console.log(page, pageSize);
  state.pages.currentPage = page
  initTableData()
}

const reset = ()=>{
  clearParams(state.queryParams)
  clearParams(props.propsParams)
}

const clearParams = (params)=>{
  Object.keys(params).forEach(key=>{
    params[key] = ''
  })
}

const search = ()=>{
  initTableData()
}

const initTableData = async () => {
  if (!props.apiFun && !props.fetchOptions.url) {
    notification.error({
      message: '前端接口地址不存在',
      description: 'filterTable组件的【apiFun 或 fetch.url】不能为空！',
    });
    return
  }

  state.tableLoading = true

  try {
    let { pages,queryParams } = state
    let res = {}
    if (props.apiFun) {
      res = await props.apiFun({...pages,...queryParams,...props.propsParams}) //api 接口自己定义，返回一个promise
    }else{
      let {url,method,headers,...otherOpt} = props.fetchOptions

      let BODY = {...pages,...queryParams,...props.propsParams}
      let OPTIONS = {
        url,
        method,
        headers:{
          'content-type': 'application/json; charset=utf-8',
          ...headers
        },
        ...otherOpt
      }

      method.toUpperCase() !== 'GET' ? OPTIONS.body = JSON.stringify(BODY):''

      let URL = method.toUpperCase() == 'GET' ? `${url}${useQs(BODY)}` : url
      
      let response = await fetch(URL,OPTIONS)
      res = await response.json();
    }
    
    state.tableData = useResultField(res,props.resultField) // 定义接口返回的字段默认list --> res:{list:[]} 可根据自身情况调整 支持a.b.c.d 多层级

    state.total = useResultField(res,props.totalField)     // 定义接口返回的总数字段默认total --> 可根据自身情况调整 支持a.b.c.d 多层级

    useDefaultColumns(state.tableData)                      //如果不传columns ，则默认展示和接口中list所有字段

    state.tableLoading = false

  } catch (error) {
    notification.error({
      message: '【apiFun】接口名称错误',
      description: '错误信息：'+error,
    });
    state.tableLoading = false
  }
}

const isType = (val)=>{
  return Object.prototype.toString.call(val)
}

const selectionData = ref([])

const onChangeSelectionDefaultFun = (selectedRowKeys, selectedRows)=>{
  selectionData.value = selectedRowKeys
}

const useDefaultColumns = (tableData)=>{
  if (Array.isArray(tableData) && tableData.length > 0) {
    if (Array.isArray(props.columns) && props.columns.length > 0) {
      state.columns = props.columns
    }else{
      let row = tableData[0]
      let mapList = Object.keys(row).map(key=>{
        return {title:key,dataIndex:key}
      })
      state.columns = mapList
    }
  }
}

onMounted(()=>{
  let { selectionCfg} = props;

  if(isType(selectionCfg.onChange) !== "[object Function]"){
    selectionCfg.onChange = onChangeSelectionDefaultFun
  }

  if (!selectionCfg.rowKey) {
    selectionCfg.rowKey = (records,index)=>{return index}
  }

  initTableData()
})

const emits = defineEmits(['edit','del'])

const handleEdit = (row)=>{
  emits('edit',row)
}
const handleDel = (row)=>{
  Modal.confirm({
    title: '删除提示',
    icon:createVNode(ExclamationCircleOutlined),
    content: '此操作将删除该条数据, 是否继续?',
    okText: '确认',
    cancelText: '取消',
    onCancel(){},
    onOk(){
      emits('del',row,()=>{
        initTableData()
      })
    }
  });
  
}

//暴露给父组件
defineExpose({selectionData,initTableData})


</script>

<style lang="css" scoped>
.filter{
  display: flex;
  justify-content: space-between;
}
.filter .item{
  width: 25%;
}
.filter .btnItem{
  flex: auto;
}
</style>

