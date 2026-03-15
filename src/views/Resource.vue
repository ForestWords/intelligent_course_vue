<template>
  <div class="resource-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <el-page-header @back="goBack" content="资源管理系统" />
      <p class="page-description">上传、下载和管理您的教学资源</p>
    </div>

    <!-- 上传区域 -->
    <el-card class="upload-section" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><Upload /></el-icon>
          <span>上传资源</span>
        </div>
      </template>

      <el-upload
        ref="uploadRef"
        class="upload-demo"
        drag
        action="#"
        :auto-upload="false"
        :on-change="handleFileChange"
        :on-remove="handleFileRemove"
        :file-list="fileList"
        :limit="1"
        accept="*/*"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持PDF、DOCX、DOC、MP4、ZIP格式文件，单个文件不超过10MB<br>
            <span class="text-extract-notice">系统将自动生成对应的txt信息文件</span>
          </div>
        </template>
      </el-upload>

      <el-form :model="uploadForm" :rules="uploadRules" ref="uploadFormRef" label-width="100px" class="upload-form">
        <el-form-item label="课程" prop="courseId">
          <el-select
            v-model="uploadForm.courseId"
            placeholder="请选择课程"
            clearable
            style="width: 100%"
            :loading="courseLoading"
          >
            <el-option 
              v-for="course in courseList" 
              :key="course.id" 
              :label="`${course.name} (${course.point}学分)`" 
              :value="course.id"
            />
            <template #empty>
              <div class="empty-courses">
                <el-text type="info">暂无课程数据</el-text>
                <el-button type="text" @click="goToCourseManagement">去创建课程</el-button>
              </div>
            </template>
          </el-select>
        </el-form-item>
        
        <el-button
          type="success"
          :loading="isUploading"
          :disabled="!fileList.length || !uploadForm.courseId"
          @click="handleUpload"
          class="upload-btn"
        >
          <el-icon><Upload /></el-icon>
          开始上传
        </el-button>
      </el-form>
    </el-card>

    <!-- 搜索和操作区域 -->
    <el-card class="action-section" shadow="never">
      <div class="action-bar">
        <div class="search-group">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索资源名称..."
            clearable
            @clear="loadResources"
            @keyup.enter="searchResources"
          >
            <template #append>
              <el-button @click="searchResources">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
            </template>
          </el-input>
        </div>
        
        <div class="action-buttons">
          <el-button type="primary" @click="reloadAllData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
          
          <el-popover
            placement="bottom"
            title="筛选条件"
            width="200"
            trigger="click"
          >
            <template #reference>
              <el-button>
                <el-icon><Filter /></el-icon>
                筛选
              </el-button>
            </template>
            <el-form :model="filterForm" label-width="60px">
              <el-form-item label="类型">
                <el-select v-model="filterForm.type" placeholder="选择文件类型" clearable>
                  <el-option label="所有类型" value="" />
                  <el-option label="PDF" value="pdf" />
                  <el-option label="DOCX" value="docx" />
                  <el-option label="DOC" value="doc" />
                  <el-option label="MP4" value="mp4" />
                  <el-option label="ZIP" value="zip" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="applyFilter" size="small">应用</el-button>
                <el-button @click="resetFilter" size="small">重置</el-button>
              </el-form-item>
            </el-form>
          </el-popover>
        </div>
      </div>
    </el-card>

    <!-- 资源列表 -->
    <el-card class="resource-list-section" shadow="never">
      <template #header>
        <div class="list-header">
          <span>资源列表</span>
          <div class="header-right">
            <el-text type="info" size="small">已加载课程: {{ courseList.length }}</el-text>
            <el-tag type="info">共 {{ resources.length }} 个资源</el-tag>
          </div>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="filteredResources"
        style="width: 100%"
        empty-text="暂无资源数据"
      >
        <el-table-column type="index" width="60" label="序号" />
        
        <el-table-column label="文件信息" min-width="250">
          <template #default="{ row }">
            <div class="file-info">
              <el-icon :size="24" :color="getFileColor(row.type)">
                <component :is="getFileIcon(row.type)" />
              </el-icon>
              <div class="file-details">
                <div class="file-name">{{ row.name }}</div>
                <div class="file-meta">
                  <el-tag size="small" :type="getTagType(row.type)">{{ row.type.toUpperCase() }}</el-tag>
                  <span v-if="row.courseName" class="course-name">{{ row.courseName }}</span>
                  <span v-else class="course-id">课程ID: {{ row.course_id }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="courseName" label="所属课程" width="180">
          <template #default="{ row }">
            <el-tag v-if="row.courseName" type="primary">
              {{ row.courseName }}
            </el-tag>
            <el-tag v-else type="info">
              课程ID: {{ row.course_id }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="350" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              type="primary"
              @click="downloadResource(row)"
            >
              <el-icon><Download /></el-icon>
              下载
            </el-button>
            
            <el-button
              size="small"
              @click="viewTxtContent(row)"
            >
              <el-icon><View /></el-icon>
              查看信息
            </el-button>
            
            <el-popconfirm
              title="确定要删除这个资源吗？"
              @confirm="deleteResource(row.id)"
            >
              <template #reference>
                <el-button size="small" type="danger">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="resources.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- TXT内容查看对话框 -->
    <el-dialog
      v-model="showTxtModal"
      :title="txtTitle"
      width="600px"
      center
      destroy-on-close
    >
      <div class="txt-viewer" v-if="selectedResource">
        <div class="txt-header">
          <el-tag type="primary">{{ selectedResource.type.toUpperCase() }}</el-tag>
          <el-text type="info">文件: {{ selectedResource.name }}</el-text>
          <el-text type="info">课程: {{ selectedResource.courseName || `课程ID: ${selectedResource.course_id}` }}</el-text>
        </div>
        
        <div class="txt-body">
          <el-alert
            v-if="txtContentLoading"
            title="正在加载文件信息..."
            type="info"
            :closable="false"
            center
            show-icon
          />
          
          <div v-else-if="txtContent" class="txt-content">
            <pre>{{ txtContent }}</pre>
          </div>
          
          <div v-else class="no-txt-content">
            <el-empty description="暂无文件信息" />
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showTxtModal = false">关闭</el-button>
          <el-button type="primary" @click="downloadResource(selectedResource!)">
            <el-icon><Download /></el-icon>
            下载原文件
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadInstance, UploadFile, UploadFiles, FormInstance, FormRules } from 'element-plus'
import axios from 'axios'

// 导入 Element Plus Icons
import {
  Upload,
  UploadFilled,
  Download,
  Delete,
  View,
  Refresh,
  Search,
  Filter,
  Document as DocIcon,
  Picture,
  VideoCamera,
  Folder,
  Files
} from '@element-plus/icons-vue'

// 类型定义 - 根据后端返回的数据结构调整
interface Resource {
  id: number
  name: string
  type: string
  path: string
  courseID: number  // 注意：这里是 courseID 而不是 course_id
  courseName?: string
}

interface Course {
  id: number
  name: string
  point: number
  classHour: number
  teacher_id: number
  teacher_school: string
}

// 响应式数据
const resources = ref<Resource[]>([])
const courseList = ref<Course[]>([])
const courseLoading = ref(false)
const fileList = ref<UploadFile[]>([])
const uploadForm = ref({
  courseId: ''
})
const searchKeyword = ref('')
const filterForm = ref({
  type: ''
})
const isUploading = ref(false)
const loading = ref(false)
const showTxtModal = ref(false)
const selectedResource = ref<Resource | null>(null)
const txtContent = ref<string>('')
const txtContentLoading = ref(false)
const uploadRef = ref<UploadInstance>()
const uploadFormRef = ref<FormInstance>()

const pagination = ref({
  currentPage: 1,
  pageSize: 10
})

// 表单验证规则
const uploadRules: FormRules = {
  //courseId: [
    //{ required: true, message: '请选择课程', trigger: 'change' }
  //]
}

// API 基础地址
const API_BASE = 'http://localhost:8082'

// 计算属性
const filteredResources = computed(() => {
  let filtered = resources.value
  
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(resource => 
      resource.name.toLowerCase().includes(keyword) ||
      (resource.courseName && resource.courseName.toLowerCase().includes(keyword))
    )
  }
  
  if (filterForm.value.type) {
    filtered = filtered.filter(resource => 
      resource.type.toLowerCase() === filterForm.value.type.toLowerCase()
    )
  }
  
  const start = (pagination.value.currentPage - 1) * pagination.value.pageSize
  const end = start + pagination.value.pageSize
  return filtered.slice(start, end)
})

const txtTitle = computed(() => {
  if (!selectedResource.value) return '文件信息'
  return `文件信息 - ${selectedResource.value.name}`
})

// 课程ID到名称的映射函数
const getCourseNameById = (courseId: number): string => {
  console.log('查找课程名称，课程ID:', courseId, '课程列表:', courseList.value)
  
  if (!courseId) return '未知课程'
  
  const course = courseList.value.find(c => c.id === courseId)
  
  if (course) {
    console.log('找到课程:', course.name)
    return course.name
  }
  
  console.log('未找到课程，课程ID:', courseId)
  return `课程ID: ${courseId}`
}

// 刷新并重新匹配课程名称
const refreshCourseNames = () => {
  console.log('刷新课程名称匹配...')
  resources.value = resources.value.map(resource => ({
    ...resource,
    courseName: getCourseNameById(resource.courseID)  // 使用 courseID
  }))
  console.log('刷新后的资源列表:', resources.value)
}

// 生命周期
onMounted(async () => {
  console.log('组件挂载，开始加载数据...')
  await loadCourses()
  await loadResources()
})

// 获取当前用户信息
const getCurrentUser = () => {
  const userStr = localStorage.getItem("currentUser")
  if (userStr) {
    return JSON.parse(userStr)
  }
  return null
}

// 加载课程列表
const loadCourses = async () => {
  console.log('开始加载课程列表...')
  courseLoading.value = true
  try {
    const user = getCurrentUser()
    
    if (!user || !user.id) {
      ElMessage.warning('请先登录')
      courseList.value = []
      return
    }

    const response = await axios.post(`${API_BASE}/teachercourse/list`, null, {
      params: { teacher_id: user.id }
    })

    console.log('课程API响应:', response.data)

    // 处理响应数据
    if (Array.isArray(response.data)) {
      courseList.value = response.data
    } else if (response.data && Array.isArray(response.data.data)) {
      courseList.value = response.data.data
    } else {
      courseList.value = []
    }

    console.log('课程列表:', courseList.value)

    if (courseList.value.length === 0) {
      ElMessage.warning('暂无课程数据，请先创建课程')
    } else {
      console.log(`成功加载了 ${courseList.value.length} 门课程`)
    }

  } catch (error: any) {
    console.error('加载课程失败:', error)
    ElMessage.error('加载课程失败')
  } finally {
    courseLoading.value = false
  }
}

// 加载资源列表
const loadResources = async () => {
  console.log('开始加载资源列表...')
  loading.value = true
  try {
    const response = await axios.get(`${API_BASE}/resources/list`)
    
    console.log('资源API响应:', response.data)

    if (response.data?.code === 200) {
      const resourceList = response.data.data || []
      console.log('原始资源列表:', resourceList)
      
      // 直接存储资源
      resources.value = resourceList
      
      // 加载完资源后，尝试匹配课程名称
      if (courseList.value.length > 0) {
        refreshCourseNames()
      }
      
      ElMessage.success(`加载了 ${resources.value.length} 个资源`)
    } else {
      ElMessage.error('加载资源列表失败: ' + response.data?.message)
    }
  } catch (error) {
    console.error('加载资源失败:', error)
    ElMessage.error('加载资源列表失败')
  } finally {
    loading.value = false
  }
}

// 完全刷新数据
const reloadAllData = async () => {
  console.log('完全刷新数据...')
  await loadCourses()
  await loadResources()
  ElMessage.success('数据已刷新')
}

// 搜索资源
const searchResources = () => {
  pagination.value.currentPage = 1
}

const applyFilter = () => {
  pagination.value.currentPage = 1
  ElMessage.info('筛选条件已应用')
}

const resetFilter = () => {
  filterForm.value.type = ''
  pagination.value.currentPage = 1
  ElMessage.success('筛选条件已重置')
}

// 文件上传处理
const handleFileChange = (file: UploadFile, files: UploadFiles) => {
  fileList.value = files
}

const handleFileRemove = (file: UploadFile, files: UploadFiles) => {
  fileList.value = files
}

// 上传文件
const handleUpload = async () => {
  if (!fileList.value.length) {
    ElMessage.warning('请先选择要上传的文件')
    return
  }

  const file = fileList.value[0]
  if (!file.raw) {
    ElMessage.error('文件数据异常')
    return
  }

  // 先进行表单验证（课程选择验证在这里）
  if (!uploadFormRef.value) return
  
  try {
    await uploadFormRef.value.validate()
  } catch (error) {
    // 验证失败，直接返回，不显示额外消息
    console.log('表单验证失败:', error)
    return
  }

  // 检查文件格式
  const fileName = file.raw.name.toLowerCase()
  const allowedExtensions = ['.pdf', '.docx', '.doc', '.mp4', '.zip']
  const isValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext))
  
  if (!isValidExtension) {
    ElMessage.error(`只支持以下格式：${allowedExtensions.join(', ')}`)
    return
  }

  isUploading.value = true
  
  try {
    const formData = new FormData()
    formData.append('file', file.raw)
    formData.append('courseId', uploadForm.value.courseId)

    console.log('上传文件，课程ID:', uploadForm.value.courseId)

    const response = await axios.post(`${API_BASE}/resources/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (response.data?.code === 200) {
      ElMessage.success('文件上传成功')
      ElMessage.success('已自动生成txt信息文件')
      
      // 关键：先清除验证状态，再清空表单
      uploadFormRef.value?.clearValidate()
      
      // 清空表单
      fileList.value = []
      uploadForm.value.courseId = ''
      if (uploadRef.value) {
        uploadRef.value.clearFiles()
      }
      
      // 刷新列表
      await loadResources()
    } else {
      ElMessage.error('上传失败: ' + (response.data?.message || '未知错误'))
    }
  } catch (error: any) {
    console.error('上传错误:', error)
    ElMessage.error('上传失败: ' + (error.response?.data?.message || error.message))
  } finally {
    isUploading.value = false
  }
}

// 下载资源
const downloadResource = (resource: Resource) => {
  window.open(`${API_BASE}/resources/download/${resource.id}`, '_blank')
  ElMessage.success('开始下载文件: ' + resource.name)
}

// 查看TXT内容
const viewTxtContent = async (resource: Resource) => {
  selectedResource.value = resource
  txtContentLoading.value = true
  showTxtModal.value = true
  txtContent.value = ''
  
  try {
    // 模拟TXT文件内容
    txtContent.value = `文件名: ${resource.name}\n课程ID: ${resource.courseID}\n课程名称: ${resource.courseName || getCourseNameById(resource.courseID)}\n文件类型: ${resource.type.toUpperCase()}\n\n注意：\n这是系统自动生成的信息文件。\n实际文件内容需要在服务器端读取对应的txt文件。\n\n上传时间: 系统自动记录\n文件大小: 系统自动记录\n文件描述: 教学资源文件\n生成时间: 系统自动生成`
    
  } catch (error) {
    console.error('获取文件信息失败:', error)
    txtContent.value = '无法加载文件信息'
  } finally {
    txtContentLoading.value = false
  }
}

// 删除资源
const deleteResource = async (id: number) => {
  try {
    const response = await axios.delete(`${API_BASE}/resources/${id}`)
    
    if (response.data?.code === 200) {
      ElMessage.success('资源删除成功')
      await loadResources()
    } else {
      ElMessage.error('删除失败: ' + response.data?.message)
    }
  } catch (error: any) {
    console.error('删除错误:', error)
    ElMessage.error('删除失败: ' + (error.response?.data?.message || error.message))
  }
}

// 跳转到课程管理
const goToCourseManagement = () => {
  window.location.href = '/teachercourse'
}

// 分页处理
const handleSizeChange = (val: number) => {
  pagination.value.pageSize = val
  pagination.value.currentPage = 1
}

const handleCurrentChange = (val: number) => {
  pagination.value.currentPage = val
}

const goBack = () => {
  window.history.back()
}

// 工具函数
const getFileIcon = (fileType: string) => {
  const type = fileType.toLowerCase()
  if (type === 'pdf') return DocIcon
  if (type === 'docx' || type === 'doc') return DocIcon
  if (type === 'jpg' || type === 'png' || type === 'jpeg') return Picture
  if (type === 'mp4') return VideoCamera
  if (type === 'zip') return Folder
  return Files
}

const getFileColor = (fileType: string): string => {
  const type = fileType.toLowerCase()
  if (type === 'pdf') return '#f56c6c'
  if (type === 'docx' || type === 'doc') return '#409eff'
  if (type === 'jpg' || type === 'png' || type === 'jpeg') return '#67c23a'
  if (type === 'mp4') return '#e6a23c'
  if (type === 'zip') return '#b779d1'
  return '#909399'
}

const getTagType = (fileType: string): 'danger' | 'primary' | 'success' | 'warning' | 'info' => {
  const type = fileType.toLowerCase()
  if (type === 'pdf') return 'danger'
  if (type === 'docx' || type === 'doc') return 'primary'
  if (type === 'jpg' || type === 'png' || type === 'jpeg') return 'success'
  if (type === 'mp4') return 'warning'
  if (type === 'zip') return 'info'
  return 'info'
}
</script>

<style scoped>
.resource-management {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
  margin-left: 50px;
  width: calc(100% - 100px);
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 24px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-description {
  margin: 8px 0 0 0;
  color: #909399;
  font-size: 14px;
}

.upload-section {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.upload-form {
  margin-top: 20px;
}

.upload-btn {
  width: 100%;
  margin-top: 10px;
}

.empty-courses {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 10px;
}

.text-extract-notice {
  color: #409eff;
  font-size: 12px;
}

.action-section {
  margin-bottom: 20px;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.search-group {
  flex: 1;
  max-width: 400px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.resource-list-section {
  margin-bottom: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.file-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.file-name {
  font-weight: 500;
  color: #303133;
  word-break: break-all;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.course-name {
  font-size: 12px;
  color: #409eff;
  font-weight: 500;
}

.course-id {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
}

.no-course {
  color: #c0c4cc;
  font-style: italic;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

/* TXT查看器样式 */
.txt-viewer {
  min-height: 300px;
}

.txt-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.txt-body {
  min-height: 200px;
  max-height: 60vh;
  overflow: auto;
}

.txt-content {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 20px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.6;
  font-size: 14px;
  max-height: 400px;
  overflow: auto;
}

.no-txt-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .resource-management {
    padding: 12px;
    margin-left: 0;
    width: 100%;
  }
  
  .action-bar {
    flex-direction: column;
    gap: 12px;
  }
  
  .search-group {
    max-width: 100%;
  }
  
  .action-buttons {
    width: 100%;
    justify-content: flex-end;
  }
  
  .file-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .header-right {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .resource-management {
    padding: 8px;
  }
  
  .page-header {
    padding: 15px;
  }
  
  .card-header {
    font-size: 14px;
  }
}

/* 中等屏幕适配 */
@media (max-width: 1200px) {
  .resource-management {
    margin-left: 220px;
    width: calc(100% - 220px);
  }
}

/* 小屏幕时隐藏侧边栏，显示汉堡菜单 */
@media (max-width: 768px) {
  .resource-management {
    margin-left: 0;
    width: 100%;
  }
}
</style>