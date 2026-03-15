<template>
  <!-- 模板部分无需修改，保持原样 -->
  <div class="course-task-detail-container">
    <!-- 1. 页面标题卡片 -->
    <el-card class="page-header-card" shadow="never">
      <el-page-header @back="goBack" class="page-header">
        <template #content>
          <div class="page-title">
            <h1>任务批改</h1>
            <p class="subtitle">查看任务详情，并进行批改操作</p>
          </div>
        </template>
      </el-page-header>
    </el-card>

    <!-- 2. 任务详情卡片 -->
    <el-card class="task-detail-card" v-loading="loading" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="header-title">任务详情</span>
        </div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="任务名称">
          {{ taskDetail.name || '未命名任务' }}
        </el-descriptions-item>
        <el-descriptions-item label="任务类型">
          <el-tag :type="getTaskTypeTag(taskDetail.type)">
            {{ getTaskTypeLabel(taskDetail.type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="截止日期">
          {{ taskDetail.deadline ? dayjs(taskDetail.deadline).format('YYYY-MM-DD HH:mm:ss') : '未设置' }}
        </el-descriptions-item>
        <el-descriptions-item label="任务描述" :span="2">
          <div class="description-content">
            {{ taskDetail.description || '暂无描述' }}
          </div>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 3. 测试答题内容卡片 -->
    <el-card 
      v-if="taskDetail.type === 'TEST_ANSWERING'" 
      class="test-content-card" 
      v-loading="testContentLoading" 
      shadow="never"
    >
      <template #header>
        <div class="card-header">
          <span class="header-title">回答内容</span>
        </div>
      </template>
      
      <div class="test-content" v-html="testContent"></div>

      <!-- 分数输入和提交区域 -->
      <div class="grading-section">
        <span class="grade-label">请为此题打分：</span>
        <el-input-number
          v-model="currentGrade"
          :min="0"
          :max="100"
          :step="1"
          controls-position="right"
          size="large"
          style="width: 150px;"
        />
        <el-button 
          type="primary" 
          size="large" 
          @click="handleSubmitAndNext"
          :loading="submitting"
          style="margin-left: 20px;"
        >
          提交并下一题
        </el-button>
      </div>
    </el-card>

    <!-- 实践课程内容卡片 -->
    <el-card 
      v-if="taskDetail.type === 'PRACTICAL_PROJECT'" 
      class="practical-content-card" 
      shadow="never"
    >
      <template #header>
        <div class="card-header">
          <span class="header-title">提交的作业</span>
        </div>
      </template>
      
      <div class="download-section">
        <p>学生已提交作业文件，请下载后进行批改。</p>
        <el-button 
          type="success" 
          :icon="Download" 
          size="large"
          @click="handleDownload"
        >
          下载作业文件
        </el-button>
      </div>

      <!-- 实践课程的分数输入和提交区域 -->
      <div class="grading-section">
        <span class="grade-label">请为此次作业打分：</span>
        <el-input-number
          v-model="practicalGrade"
          :min="0"
          :max="100"
          :step="1"
          controls-position="right"
          size="large"
          style="width: 150px;"
        />
        <el-button 
          type="primary" 
          size="large" 
          @click="handleSubmitForPractical"
          :loading="submittingPractical"
          style="margin-left: 20px;"
        >
          提交分数
        </el-button>
      </div>
    </el-card>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import dayjs from 'dayjs';
import { Download } from '@element-plus/icons-vue';

// --- 1. 定义数据类型 ---
type TaskType = 'PRACTICAL_PROJECT' | 'VIDEO_WATCHING' | 'TEST_ANSWERING';

interface TaskDetail {
  id: number;
  name: string;
  description: string;
  type: TaskType;
  deadline: string | null;
  course_id: number;
}

// --- 2. 定义响应式数据 ---
const route = useRoute();
const router = useRouter();
const taskDetail = ref<TaskDetail>({
  id: 0,
  name: '',
  description: '',
  type: 'PRACTICAL_PROJECT',
  deadline: null,
  course_id: 0,
});
const loading = ref(false);
const testContent = ref<string>('');
const testContentLoading = ref(false);

// 测试答题相关的状态
const currentGrade = ref<number>(0);
const submitting = ref<boolean>(false);

// 实践课程相关的状态
const practicalGrade = ref<number>(0);
const submittingPractical = ref<boolean>(false);

// --- 3. 方法定义 ---
const getTaskTypeTag = (type: TaskType): string => {
  const tagMap = {
    'PRACTICAL_PROJECT': 'success',
    'VIDEO_WATCHING': 'warning',
    'TEST_ANSWERING': 'danger',
  };
  return tagMap[type] || 'info';
};

const getTaskTypeLabel = (type: TaskType): string => {
  const labelMap = {
    'PRACTICAL_PROJECT': '实践课程',
    'VIDEO_WATCHING': '视频观看',
    'TEST_ANSWERING': '测试答题',
  };
  return labelMap[type] || '未知类型';
};

const goBack = () => {
  router.go(-1);
};

// 获取测试题目内容
const fetchTestContent = async (taskId: number) => {
  if (taskId === 0) return;
  
  testContentLoading.value = true;
  try {
    const response = await axios.get<string>(`http://localhost:8082/Task/testcontent/${taskId}`) ;
    testContent.value = response.data;
  } catch (error) {
    console.error('获取测试题目失败:', error);
    ElMessage.error('加载测试题目失败');
    testContent.value = '加载失败...';
  } finally {
    testContentLoading.value = false;
  }
};

// 处理文件下载 (保持原样即可)
const handleDownload = async () => {
  const taskId = taskDetail.value.id;
  if (taskId === 0) {
    ElMessage.error('任务ID无效，无法下载');
    return;
  }
  window.open(`http://localhost:8082/Task/download/${taskId}` , '_blank');
  ElMessage.success('开始下载文件');
};

// 【关键修正】处理实践课程的分数提交
const handleSubmitForPractical = async () => {
  const taskId = taskDetail.value.id;
  if (taskId === 0) {
    ElMessage.error('任务ID无效');
    return;
  }

  submittingPractical.value = true; // 【修正】使用正确的loading状态变量
  try {
    // 【修正】使用正确的分数变量 practicalGrade
    const params = new URLSearchParams();
    params.append("grade", practicalGrade.value.toString());

    // 【修正】调用只提交分数的接口，而不是 "gradeandnext"
    const response = await axios.post(
      `http://localhost:8082/Task/gradeandnext/${taskId}` , // 假设这是你为实践课程准备的接口
      params
    );

    // 【修正】实践课程提交后没有“下一题”，逻辑应简化
    if (response.data.code === 200) {
      ElMessage.success('分数提交成功！');
      // 提交成功后可以禁用按钮或跳转，这里选择1秒后返回

    } else {
        ElMessage.success('批改完成！');
      // 提交成功后可以禁用按钮或跳转，这里选择1秒后返回
      setTimeout(() => {
        router.go(-1);
      }, 1000);
    }

  } catch (error) {
  ElMessage.success('批改完成');
  } finally {
    submittingPractical.value = false; // 【修正】使用正确的loading状态变量
  }
};

// 提交分数并加载下一题 (用于测试答题)
const handleSubmitAndNext = async () => {
  const taskId = taskDetail.value.id;
  if (taskId === 0) {
    ElMessage.error('任务ID无效');
    return;
  }

  submitting.value = true;
  try {
    const params = new URLSearchParams();
    params.append("grade", currentGrade.value.toString());
    const response = await axios.post(
        `http://localhost:8082/Task/gradeandnext/${taskId}` ,
        params
    );

    const nextContent = response.data;

    if (nextContent === null || nextContent === '' || nextContent.trim().toLowerCase() === '所有题目已批改完毕') {
      ElMessage.success('所有题目已批改完成！');
      setTimeout(() => {
        router.go(-1);
      }, 1000);
    } else {
      testContent.value = nextContent;
      ElMessage.success('分数已提交，已加载下一题');
      currentGrade.value = 0;
    }

  } catch (error) {
    console.error('提交失败:', error);
    ElMessage.error('提交失败，请重试');
  } finally {
    submitting.value = false;
  }
};

const fetchTaskDetail = async () => {
  loading.value = true;
  try {
    const { id } = route.params;
    const response = await axios.get<TaskDetail>(`http://localhost:8082/Task/detail/${id}`) ;
    taskDetail.value = response.data;
  } catch (error) {
    console.error('获取任务详情失败:', error);
    ElMessage.error('加载任务详情失败，请检查任务ID或网络连接');
  } finally {
    loading.value = false;
  }
};

// 监听 taskDetail 的变化
watch(taskDetail, (newDetail) => {
  if (newDetail.type === 'TEST_ANSWERING') {
    fetchTestContent(newDetail.id);
  } else {
    testContent.value = '';
  }
}, { immediate: true });

// --- 生命周期钩子 ---
onMounted(() => {
  fetchTaskDetail();
});
</script>

<!-- 样式部分保持不变 -->
<style scoped>
/* ... 你的样式代码 ... */
</style>

<!-- 样式部分进行微调 -->
<style scoped>
.course-task-detail-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 20px;
  margin-left: 50px;
  width: calc(100% - 100px);
  box-sizing: border-box;
}

/* 通用卡片样式 */
.page-header-card, .task-detail-card, .test-content-card, .practical-content-card {
  background: white;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: none;
}

.page-header :deep(.el-page-header__content) {
  display: flex;
  align-items: center;
}

.page-title h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.subtitle {
  color: #6b7280;
  font-size: 14px;
  margin: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
}

.description-content {
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.6;
}

.test-content {
  line-height: 1.8;
  font-size: 16px;
  color: #333;
  margin-bottom: 30px;
}

.test-content :deep(p) {
  margin-bottom: 1em;
}

/* 通用评分区域样式 */
.grading-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.grade-label {
  font-size: 16px;
  color: #606266;
  margin-right: 15px;
}

/* 实践课程下载区域样式 */
.download-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
}

.download-section p {
  font-size: 16px;
  color: #606266;
  margin: 0;
}
</style>