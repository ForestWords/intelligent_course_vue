<template>
  <div class="student-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <el-page-header @back="goBack" content="学生课程管理" />
      <p class="page-description">管理课程学生，为学生分配课程</p>
    </div>

    <!-- 主操作区域 -->
    <el-card class="main-section" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon><User /></el-icon>
          <span>添加学生到课程</span>
        </div>
      </template>

      <!-- 选择课程 -->
      <div class="course-selection">
        <div class="section-title">
          <el-icon><Document /></el-icon>
          <span>选择课程</span>
        </div>
        <el-select
          v-model="selectedCourseId"
          placeholder="请选择课程"
          clearable
          style="width: 100%"
          :loading="courseLoading"
          @change="onCourseChange"
        >
          <el-option 
            v-for="course in courseList" 
            :key="course.id" 
            :label="`${course.name} (${course.point}学分, ${course.classHour}课时)`" 
            :value="course.id"
          />
        </el-select>
        
        <div v-if="selectedCourseName" class="selected-course-info">
          <el-tag type="primary" size="large">
            <el-icon><Document /></el-icon>
            已选择: {{ selectedCourseName }}
          </el-tag>
        </div>
      </div>

      <!-- 搜索和选择学生 -->
      <div class="student-selection">
        <div class="section-title">
          <el-icon><User /></el-icon>
          <span>选择学生</span>
        </div>
        
        <div class="search-section">
          <el-input
            v-model="studentSearch"
            placeholder="搜索学生（姓名或学号）"
            clearable
            @clear="searchStudents"
            @keyup.enter="searchStudents"
          >
            <template #append>
              <el-button @click="searchStudents">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
            </template>
          </el-input>
        </div>

        <!-- 学生列表 -->
        <div class="student-list">
          <div class="list-header">
            <span>学生列表</span>
            <!-- 修复：使用安全的数据访问 -->
            <el-tag type="info">共 {{ studentList.length || 0 }} 名学生</el-tag>
          </div>
          
          <el-table
            v-loading="studentLoading"
            :data="filteredStudents"
            style="width: 100%"
            empty-text="暂无学生数据"
            @selection-change="handleSelectionChange"
          >
            <el-table-column type="selection" width="55" />
            
            <el-table-column label="学生信息" min-width="250">
              <template #default="{ row }">
                <div v-if="row" class="student-info">
                  <el-avatar :size="40" :style="{ backgroundColor: getAvatarColor(row.id) }">
                    {{ row.name?.charAt(0) || '?' }}
                  </el-avatar>
                  <div class="student-details">
                    <div class="student-name">{{ row.name || '未知学生' }}</div>
                    <div class="student-meta">
                      <el-tag size="small" type="info">学号: {{ row.id || '未知' }}</el-tag>
                      <el-tag size="small">学院: {{ row.school || '未知' }}</el-tag>
                      <el-tag size="small" type="success">年级: {{ row.grade || '未知' }}</el-tag>
                    </div>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="班级" width="120">
              <template #default="{ row }">
                <el-tag v-if="row && row.section" type="primary">
                  {{ row.section }}
                </el-tag>
                <span v-else class="no-section">未分班</span>
              </template>
            </el-table-column>

            <el-table-column label="GPA" width="100">
              <template #default="{ row }">
                <el-rate
                  v-if="row"
                  :model-value="row.gpa || 0"
                  disabled
                  show-score
                  text-color="#ff9900"
                  :score-template="row.gpa ? '{value}' : '暂无'"
                  :max="4"
                  :allow-half="true"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button
          type="primary"
          :loading="isAdding"
          :disabled="!selectedCourseId || selectedStudents.length === 0"
          @click="addStudentsToCourse"
          class="add-btn"
        >
          <el-icon><Plus /></el-icon>
          添加选中学生到课程 ({{ selectedStudents.length || 0 }}人)
        </el-button>
        
        <el-button @click="resetSelection">
          <el-icon><Refresh /></el-icon>
          重置选择
        </el-button>
      </div>
    </el-card>

    <!-- 已选课程的学生列表 -->
    <el-card class="enrolled-section" shadow="never">
      <template #header>
        <div class="list-header">
          <span>已选课程学生</span>
          <div v-if="selectedCourseName" class="header-right">
            <el-tag type="primary">{{ selectedCourseName }}</el-tag>
            <el-tag type="info">共 {{ enrolledStudents.length || 0 }} 名学生</el-tag>
          </div>
        </div>
      </template>

      <el-table
        v-loading="enrolledLoading"
        :data="enrolledStudents"
        style="width: 100%"
        empty-text="该课程暂无学生"
      >
        <el-table-column type="index" width="60" label="序号" />
        
        <el-table-column label="学生信息" min-width="250">
          <template #default="{ row }">
            <div v-if="row" class="student-info">
              <el-avatar :size="40" :style="{ backgroundColor: getAvatarColor(row.student_id) }">
                {{ row.name?.charAt(0) || '?' }}
              </el-avatar>
              <div class="student-details">
                <div class="student-name">{{ row.name || '未知学生' }}</div>
                <div class="student-meta">
                  <el-tag size="small" type="info">学号: {{ row.student_id || '未知' }}</el-tag>
                  <el-tag size="small">学院: {{ row.school || row.student_school || '未知' }}</el-tag>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="班级" width="120">
          <template #default="{ row }">
            <el-tag v-if="row && row.section" type="primary">
              {{ row.section }}
            </el-tag>
            <span v-else class="no-section">未分班</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-popconfirm
              v-if="row && row.student_id"
              title="确定要将此学生移出课程吗？"
              @confirm="removeStudentFromCourse(row.student_id)"
            >
              <template #reference>
                <el-button size="small" type="danger">
                  <el-icon><Delete /></el-icon>
                  移出课程
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadInstance, FormInstance } from 'element-plus'
import axios from 'axios'

// 导入 Element Plus Icons
import {
  User,
  Document,
  Search,
  Plus,
  Delete,
  Refresh,
  Download,
  Upload,
  View
} from '@element-plus/icons-vue'

// 类型定义
interface Student {
  id: number
  name: string
  password: string
  school: string
  type: string
  section: string
  gpa: number
  grade: number
}

interface Course {
  id: number
  name: string
  point: number
  classHour: number
  teacher_id: number
  teacher_school: string
}

interface CourseStudent {
  student_id: number
  student_school: string
  course_id: number
  name?: string
  school?: string
  section?: string
}

// 响应式数据
const courseList = ref<Course[]>([])
const studentList = ref<Student[]>([])
const enrolledStudents = ref<CourseStudent[]>([])
const selectedStudents = ref<Student[]>([])
const selectedCourseId = ref<number | null>(null)
const selectedCourseName = ref('')
const studentSearch = ref('')
const studentLoading = ref(false)
const courseLoading = ref(false)
const enrolledLoading = ref(false)
const isAdding = ref(false)

const API_BASE = 'http://localhost:8082'

// 添加模拟数据
const mockStudents: Student[] = [
  { id: 2021001, name: '张三', password: '123456', school: '计算机学院', type: 'student', section: '计科2101', gpa: 3.5, grade: 2021 },
  { id: 2021002, name: '李四', password: '123456', school: '软件学院', type: 'student', section: '软件2102', gpa: 3.2, grade: 2021 },
  { id: 2021003, name: '王五', password: '123456', school: '网络空间安全学院', type: 'student', section: '网安2101', gpa: 3.8, grade: 2021 },
  { id: 2022001, name: '赵六', password: '123456', school: '计算机学院', type: 'student', section: '计科2201', gpa: 3.0, grade: 2022 },
  { id: 2022002, name: '钱七', password: '123456', school: '软件学院', type: 'student', section: '软件2202', gpa: 3.6, grade: 2022 }
]

// 计算属性
const filteredStudents = computed(() => {
  // 确保 studentList.value 是数组
  const list = Array.isArray(studentList.value) ? studentList.value : []
  
  let filtered = list
  
  // 搜索过滤
  if (studentSearch.value) {
    const keyword = studentSearch.value.toLowerCase()
    filtered = filtered.filter(student => {
      if (!student) return false
      return student.name?.toLowerCase().includes(keyword) ||
             student.id?.toString().includes(keyword) ||
             student.school?.toLowerCase().includes(keyword)
    })
  }
  
  // 过滤掉已经在该课程中的学生
  if (selectedCourseId.value) {
    const enrolledIds = Array.isArray(enrolledStudents.value) 
      ? enrolledStudents.value.map(s => s.student_id).filter(id => id != null)
      : []
    filtered = filtered.filter(student => {
      return student && !enrolledIds.includes(student.id)
    })
  }
  
  return filtered
})

// 生命周期
onMounted(async () => {
  await loadCourses()
  await loadAllStudents()
})

// 获取当前用户信息
const getCurrentUser = () => {
  const userStr = localStorage.getItem("currentUser")
  return userStr ? JSON.parse(userStr) : null
}

// 加载课程列表
const loadCourses = async () => {
  courseLoading.value = true
  try {
    const user = getCurrentUser()
    if (!user || !user.id) {
      ElMessage.warning('请先登录')
      return
    }

    const response = await axios.post(`${API_BASE}/teachercourse/list`, null, {
      params: { teacher_id: user.id }
    })

    if (Array.isArray(response.data)) {
      courseList.value = response.data
    } else if (response.data && Array.isArray(response.data.data)) {
      courseList.value = response.data.data
    } else {
      courseList.value = []
    }

    if (courseList.value.length === 0) {
      ElMessage.warning('暂无课程数据，请先创建课程')
    }

  } catch (error: any) {
    console.error('加载课程失败:', error)
    ElMessage.error('加载课程失败')
    // 开发模式下使用模拟课程数据
    if (process.env.NODE_ENV === 'development') {
      courseList.value = [
        { id: 1, name: '数据结构', point: 3, classHour: 48, teacher_id: 1001, teacher_school: '计算机学院' },
        { id: 2, name: '算法设计', point: 4, classHour: 64, teacher_id: 1001, teacher_school: '计算机学院' },
        { id: 3, name: '数据库原理', point: 3, classHour: 48, teacher_id: 1001, teacher_school: '计算机学院' }
      ]
      ElMessage.info('开发模式：使用模拟课程数据')
    }
  } finally {
    courseLoading.value = false
  }
}

// 加载所有学生
const loadAllStudents = async () => {
  studentLoading.value = true
  try {
    const response = await axios.get(`${API_BASE}/students/list`, {
      timeout: 3000
    })
    
    if (response.data?.code === 200) {
      studentList.value = response.data.data || []
      ElMessage.success(`加载了 ${studentList.value.length} 名学生`)
    } else {
      // 如果没有获取到数据，使用模拟数据
      useMockData()
    }
  } catch (error) {
    console.error('加载学生失败:', error)
    // 网络错误时使用模拟数据
    useMockData()
  } finally {
    studentLoading.value = false
  }
}

// 使用模拟数据的函数
const useMockData = () => {
  studentList.value = [...mockStudents]
  ElMessage.info('使用模拟数据进行开发测试')
}

// 加载已选课程的学生
const loadEnrolledStudents = async (courseId: number) => {
  if (!courseId) return
  
  enrolledLoading.value = true
  try {
    const response = await axios.get(`${API_BASE}/studentscourses/list`, {
      params: { course_id: courseId }
    })
    
    if (response.data?.code === 200) {
      enrolledStudents.value = response.data.data || []
      // 补充学生信息
      await enhanceStudentInfo(enrolledStudents.value)
    } else {
      enrolledStudents.value = []
    }
  } catch (error) {
    console.error('加载已选学生失败:', error)
    enrolledStudents.value = []
    // 开发模式下使用模拟数据
    if (process.env.NODE_ENV === 'development') {
      enrolledStudents.value = [
        { student_id: 2021001, student_school: '计算机学院', course_id: courseId, name: '张三', section: '计科2101' },
        { student_id: 2021002, student_school: '软件学院', course_id: courseId, name: '李四', section: '软件2102' }
      ]
    }
  } finally {
    enrolledLoading.value = false
  }
}

// 补充学生信息
const enhanceStudentInfo = async (courseStudents: CourseStudent[]) => {
  try {
    // 获取所有学生信息
    const studentIds = courseStudents.map(cs => cs.student_id)
    if (studentIds.length === 0) return
    
    const response = await axios.post(`${API_BASE}/students/batch`, {
      ids: studentIds
    })
    
    if (response.data?.code === 200) {
      const studentsInfo = response.data.data || []
      const studentMap = new Map(studentsInfo.map(s => [s.id, s]))
      
      // 合并信息
      courseStudents.forEach(cs => {
        const studentInfo = studentMap.get(cs.student_id)
        if (studentInfo) {
          cs.name = studentInfo.name
          cs.school = studentInfo.school
          cs.section = studentInfo.section
        }
      })
    }
  } catch (error) {
    console.error('补充学生信息失败:', error)
    // 如果补充失败，尝试从本地数据获取
    courseStudents.forEach(cs => {
      const student = studentList.value.find(s => s && s.id === cs.student_id)
      if (student) {
        cs.name = student.name
        cs.school = student.school
        cs.section = student.section
      }
    })
  }
}

// 课程选择变化
const onCourseChange = async (courseId: number) => {
  if (courseId) {
    const course = courseList.value.find(c => c.id === courseId)
    selectedCourseName.value = course ? course.name : ''
    
    // 加载该课程的已选学生
    await loadEnrolledStudents(courseId)
    
    // 重置学生选择
    selectedStudents.value = []
  } else {
    selectedCourseName.value = ''
    enrolledStudents.value = []
    selectedStudents.value = []
  }
}

// 搜索学生
const searchStudents = () => {
  // 搜索逻辑已在计算属性中处理
  console.log('搜索学生:', studentSearch.value)
}

// 处理学生选择变化
const handleSelectionChange = (students: Student[]) => {
  selectedStudents.value = students
  console.log('选中学生:', selectedStudents.value.length)
}

// 添加学生到课程
const addStudentsToCourse = async () => {
  if (!selectedCourseId.value || selectedStudents.value.length === 0) {
    ElMessage.warning('请选择课程和学生')
    return
  }

  isAdding.value = true
  
  try {
    const requests = selectedStudents.value.map(student => {
      return axios.post(`${API_BASE}/studentscourses/add`, {
        student_id: student.id,
        student_school: student.school,
        course_id: selectedCourseId.value
      })
    })

    const responses = await Promise.all(requests)
    const successCount = responses.filter(r => r.data?.code === 200).length
    
    if (successCount > 0) {
      ElMessage.success(`成功添加 ${successCount} 名学生到课程`)
      
      // 刷新已选学生列表
      await loadEnrolledStudents(selectedCourseId.value)
      
      // 重置选择
      selectedStudents.value = []
    } else {
      ElMessage.error('添加学生失败')
    }
  } catch (error: any) {
    console.error('添加学生失败:', error)
    ElMessage.error('添加学生失败: ' + (error.response?.data?.message || error.message))
  } finally {
    isAdding.value = false
  }
}

// 从课程中移除学生
const removeStudentFromCourse = async (studentId: number) => {
  if (!selectedCourseId.value) {
    ElMessage.warning('请先选择课程')
    return
  }

  try {
    const response = await axios.delete(`${API_BASE}/studentscourses/remove`, {
      data: {
        student_id: studentId,
        course_id: selectedCourseId.value
      }
    })
    
    if (response.data?.code === 200) {
      ElMessage.success('学生已从课程中移除')
      
      // 刷新已选学生列表
      await loadEnrolledStudents(selectedCourseId.value)
    } else {
      ElMessage.error('移除学生失败')
    }
  } catch (error: any) {
    console.error('移除学生失败:', error)
    ElMessage.error('移除学生失败: ' + (error.response?.data?.message || error.message))
  }
}

// 重置选择
const resetSelection = () => {
  selectedStudents.value = []
  studentSearch.value = ''
}

// 生成头像颜色
const getAvatarColor = (id: number): string => {
  const colors = [
    '#409eff', '#67c23a', '#e6a23c', '#f56c6c', 
    '#b779d1', '#ff85c0', '#ffd700', '#00ced1'
  ]
  return colors[id % colors.length]
}

const goBack = () => {
  window.history.back()
}
</script>

<style scoped>
.student-management {
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

.main-section {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 18px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
  font-weight: 500;
  color: #303133;
  font-size: 16px;
}

.course-selection {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.selected-course-info {
  margin-top: 15px;
  padding: 10px;
  background-color: #f0f9ff;
  border-radius: 6px;
  border: 1px solid #d9ecff;
}

.student-selection {
  margin-bottom: 30px;
}

.search-section {
  margin-bottom: 20px;
}

.student-list {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 15px;
  background: white;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.student-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.student-name {
  font-weight: 500;
  color: #303133;
}

.student-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.no-section {
  color: #c0c4cc;
  font-style: italic;
  font-size: 12px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.add-btn {
  min-width: 300px;
}

.enrolled-section {
  margin-bottom: 20px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .student-management {
    padding: 12px;
    margin-left: 0;
    width: 100%;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .add-btn {
    min-width: 100%;
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
  .student-management {
    padding: 8px;
  }
  
  .page-header {
    padding: 15px;
  }
  
  .card-header {
    font-size: 16px;
  }
}
</style>