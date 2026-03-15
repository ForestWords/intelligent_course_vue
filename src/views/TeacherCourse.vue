<template>
  <div class="teacher-course-container">
    <div class="container">
      <!-- 页面标题 -->
      <el-page-header @back="goBack" class="page-header">
        <template #content>
          <div class="page-title">
            <h1>教学课程管理</h1>
            <p class="subtitle">管理您的教学任务，轻松掌握教学进度</p>
          </div>
        </template>
      </el-page-header>
      
      <!-- 搜索区域 -->
      <el-card class="search-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <el-icon><Search /></el-icon>
            <span>搜索条件</span>
          </div>
        </template>
        
        <el-form :model="searchForm" label-width="80px">
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="课程名称">
                <el-input
                  v-model="searchForm.name"
                  placeholder="请输入课程名称"
                  clearable
                />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item>
            <el-button type="primary" @click="searchCourses">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
            <el-button @click="resetSearch">
              <el-icon><Refresh /></el-icon>
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
      
      <!-- 操作按钮区域 -->
      <el-card class="action-card" shadow="never">
        <div class="action-buttons">
          <el-button type="success" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            新增课程
          </el-button>
          <el-button type="warning">
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
          <el-button type="info" @click="refreshData">
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
        </div>
      </el-card>
      
      <!-- 数据表格 -->
      <el-card class="table-card" shadow="never">
        <template #header>
          <div class="table-header">
            <span>课程列表</span>
            <el-tag type="info">共 {{ courses.length }} 个课程</el-tag>
          </div>
        </template>
        
        <el-table
          :data="filteredCourses"
          v-loading="loading"
          style="width: 100%"
          empty-text="暂无课程数据"
        >
          <el-table-column type="index" width="60" label="序号" />
          
          <el-table-column prop="name" label="课程名称" min-width="250">
            <template #default="{ row }">
              <div class="course-name">
                <el-icon><Document /></el-icon>
                <span>{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="point" label="学分" width="100" align="center">
            <template #default="{ row }">
              <el-tag type="success" effect="light">{{ row.point }} 学分</el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="classHour" label="课时" width="120" align="center">
            <template #default="{ row }">
              <el-text type="primary">{{ row.classHour }} 小时</el-text>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="200" fixed="right" align="center">
            <template #default="{ row }">
              <el-button
                size="small"
                type="primary"
                @click="editCourse(row)"
              >
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              
              <el-popconfirm
                title="确定要删除这个课程吗？"
                @confirm="deleteCourse(row.id)"
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
            :total="courses.length"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>
    
    <!-- 新增/编辑课程对话框 -->
    <el-dialog
      v-model="showDialog"
      :title="dialogTitle"
      width="500px"
      center
    >
      <el-form
        :model="courseForm"
        :rules="formRules"
        ref="courseFormRef"
        label-width="100px"
      >
        <el-form-item label="课程名称" prop="name">
          <el-input
            v-model="courseForm.name"
            placeholder="请输入课程名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="学分" prop="point">
          <el-input
            v-model="courseForm.point"
            placeholder="请输入学分"
            type="number"
            min="1"
            max="10"
          />
        </el-form-item>
        
        <el-form-item label="课时" prop="classHour">
          <el-input
            v-model="courseForm.classHour"
            placeholder="请输入课时"
            type="number"
            min="1"
            max="200"
          />
        </el-form-item>
        
        <!-- 移除教师ID和教师学校输入框 -->
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDialog = false">取消</el-button>
          <el-button type="primary" @click="submitForm">
            {{ isEditing ? '更新' : '添加' }}课程
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import axios from "axios";
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Search,
  Refresh,
  Plus,
  Download,
  Document,
  Edit,
  Delete
} from '@element-plus/icons-vue'

// 类型定义
interface Course {
  id: number
  name: string
  point: number
  classHour: number
  teacher_id: number
  teacher_school: string
}

// 响应式数据
const courses = ref<Course[]>([])
const loading = ref(false)
const showDialog = ref(false)
const isEditing = ref(false)
const editingCourseId = ref<number | null>(null)
const courseFormRef = ref<FormInstance>()

// 搜索表单
const searchForm = reactive({
  name: ''
})

// 课程表单
const courseForm = reactive({
  name: '',
  point: '',
  classHour: ''
})

// 分页配置
const pagination = reactive({
  currentPage: 1,
  pageSize: 10
})

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入课程名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  point: [
    { required: true, message: '请输入学分', trigger: 'blur' },
    { pattern: /^\d+$/, message: '学分必须为数字', trigger: 'blur' }
  ],
  classHour: [
    { required: true, message: '请输入课时', trigger: 'blur' },
    { pattern: /^\d+$/, message: '课时必须为数字', trigger: 'blur' }
  ]
}

// 计算属性
const filteredCourses = computed(() => {
  let filtered = courses.value
  
  if (searchForm.name) {
    filtered = filtered.filter(course => 
      course.name.toLowerCase().includes(searchForm.name.toLowerCase())
    )
  }
  
  const start = (pagination.currentPage - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filtered.slice(start, end)
})

const dialogTitle = computed(() => {
  return isEditing.value ? '编辑课程' : '新增课程'
})

// 获取当前用户信息
const getCurrentUser = () => {
  const userStr = localStorage.getItem("currentUser");
  return userStr ? JSON.parse(userStr) : null;
};

let currentUser = ref(getCurrentUser());

onMounted(() => {
  currentUser.value = getCurrentUser();
  window.addEventListener("storage", (event) => {
    if (event.key === "currentUser") {
      currentUser.value = getCurrentUser();
    }
  });
  loadCourses();
});

// 方法定义
const goBack = () => {
  window.history.back()
}

// 从数据库加载课程
const loadCourses = async () => {
  loading.value = true;
  try {
    console.log('当前用户:', currentUser.value);
    
    const response = await axios.post("http://localhost:8082/teachercourse/list", null, {
      params: {
        teacher_id: currentUser.value.id
      }
    });
    
    console.log('课程列表响应:', response);
    
    if (response.data && Array.isArray(response.data)) {
      courses.value = response.data;
      ElMessage.success(`加载了 ${response.data.length} 门课程`);
    } else {
      courses.value = [];
      ElMessage.warning('暂无课程数据');
    }
  } catch (error: any) {
    console.error('加载课程失败详情:', error);
    console.error('错误状态:', error.response?.status);
    console.error('错误数据:', error.response?.data);
    console.error('错误消息:', error.message);
    
    const errorMsg = error.response?.data || error.message;
    ElMessage.error(`加载失败: ${errorMsg}`);
    courses.value = [];
  } finally {
    loading.value = false;
  }
};

const searchCourses = () => {
  pagination.currentPage = 1;
  ElMessage.info('搜索完成');
}

const resetSearch = () => {
  searchForm.name = '';
  pagination.currentPage = 1;
  ElMessage.success('搜索条件已重置');
}

const showAddDialog = () => {
  isEditing.value = false;
  editingCourseId.value = null;
  Object.assign(courseForm, {
    name: '',
    point: '',
    classHour: ''
  });
  showDialog.value = true;
  
  nextTick(() => {
    courseFormRef.value?.clearValidate();
  });
}

const editCourse = (course: Course) => {
  isEditing.value = true;
  editingCourseId.value = course.id;
  Object.assign(courseForm, {
    name: course.name,
    point: course.point.toString(),
    classHour: course.classHour.toString()
  });
  showDialog.value = true;
  
  nextTick(() => {
    courseFormRef.value?.clearValidate();
  });
}

// 提交表单
const submitForm = async () => {
  if (!courseFormRef.value) return;

  try {
    await courseFormRef.value.validate();
    
    if (isEditing.value && editingCourseId.value !== null) {
      await updateCourse();
    } else {
      await addCourse();
    }
    
    showDialog.value = false;
  } catch (error) {
    ElMessage.error('表单验证失败，请检查输入');
  }
}

// 新增课程函数 - 修正数据类型
const addCourse = async () => {
  try {
    console.log('=== 详细数据类型检查 ===');
    console.log('原始用户ID:', currentUser.value.id, '类型:', typeof currentUser.value.id);
    console.log('原始用户学校:', currentUser.value.school, '类型:', typeof currentUser.value.school);
    
    const courseData = {
      id: 0,
      name: courseForm.name,
      point: parseInt(courseForm.point),
      classHour: parseInt(courseForm.classHour),
      teacher_id: parseInt(currentUser.value.id),
      teacher_school: currentUser.value.school
    };

    console.log('转换后的数据:');
    console.log('teacher_id:', courseData.teacher_id, '类型:', typeof courseData.teacher_id);
    console.log('teacher_school:', courseData.teacher_school, '类型:', typeof courseData.teacher_school);
    console.log('完整courseData:', JSON.stringify(courseData, null, 2));

    const response = await axios.post(
      "http://localhost:8082/teachercourse/register",
      courseData
    );

    if (response.data === 0) {
      ElMessage.success('课程添加成功');
      await loadCourses();
    } else {
      ElMessage.error("课程添加失败");
    }
  } catch (error: any) {
    console.error('添加课程失败详情:', error);
    console.error('错误响应数据:', error.response?.data);
    ElMessage.error(`添加失败: ${error.response?.data || error.message}`);
  }
}

// 更新课程函数
const updateCourse = async () => {
  try {
    // 先删除原课程
    const deleteResponse = await axios.delete(
      "http://localhost:8082/teachercourse/delete",
      {
        data: {
          id: editingCourseId.value,
          name: courseForm.name,
          point: Number(courseForm.point),
          classHour: Number(courseForm.classHour),
          teacher_id: currentUser.value.id,
          teacher_school: currentUser.value.school
        }
      }
    );

    if (deleteResponse.data === 0) {
      // 再新增更新后的课程
      const addResponse = await axios.post(
        "http://localhost:8082/teachercourse/register",
        {
          name: courseForm.name,
          point: Number(courseForm.point),
          classHour: Number(courseForm.classHour),
          teacher_id: currentUser.value.id,
          teacher_school: currentUser.value.school
        }
      );

      if (addResponse.data === 0) {
        ElMessage.success('课程更新成功');
        await loadCourses();
      } else {
        ElMessage.error("课程更新失败");
      }
    } else {
      ElMessage.error("课程更新失败");
    }
  } catch (error: any) {
    console.error('更新课程失败:', error);
    ElMessage.error(`更新失败: ${error.response?.data || error.message}`);
  }
}

// 删除课程
const deleteCourse = async (id: number) => {
  try {
    // 找到要删除的课程对象
    const courseToDelete = courses.value.find(course => course.id === id);
    if (!courseToDelete) {
      ElMessage.error('未找到要删除的课程');
      return;
    }

    const response = await axios.delete(
      "http://localhost:8082/teachercourse/delete",
      {
        data: courseToDelete
      }
    );

    if (response.data === 0) {
      ElMessage.success('课程删除成功');
      await loadCourses();
    } else {
      ElMessage.error('删除失败');
    }
  } catch (error: any) {
    console.error('删除课程失败:', error);
    ElMessage.error(`删除失败: ${error.response?.data || error.message}`);
  }
}

const refreshData = () => {
  loadCourses();
}

const handleSizeChange = (val: number) => {
  pagination.pageSize = val;
  pagination.currentPage = 1;
}

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val;
}
</script>

<style scoped>
.teacher-course-container {
  background-color: #f5f7fa;
  min-height: 100vh;
  padding: 20px;
  /* 添加左边距避免被侧边栏遮挡 */
  margin-left: 50px;
  /* 确保内容区域宽度正确 */
  width: calc(100% - 100px);
  box-sizing: border-box;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-title h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.subtitle {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.search-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.action-card {
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.table-card {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.course-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

/* 响应式设计 - 适配移动端 */
@media (max-width: 768px) {
  .teacher-course-container {
    padding: 12px;
    margin-left: 0;
    width: 100%;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons .el-button {
    width: 100%;
  }
  
  .table-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .page-title h1 {
    font-size: 20px;
  }
  
  .subtitle {
    font-size: 12px;
  }
  
  .teacher-course-container {
    padding: 8px;
  }
}

/* 中等屏幕适配 */
@media (max-width: 1200px) {
  .teacher-course-container {
    margin-left: 220px;
    width: calc(100% - 220px);
  }
}

/* 小屏幕时隐藏侧边栏，显示汉堡菜单 */
@media (max-width: 768px) {
  .teacher-course-container {
    margin-left: 0;
    width: 100%;
  }
}
</style>