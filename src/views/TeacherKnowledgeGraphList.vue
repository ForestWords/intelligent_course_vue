<template>
    <div class="course-task-list-container">
        <!-- 1. 页面标题卡片 -->
        <el-card class="page-header-card" shadow="never">
            <el-page-header @back="goBack" class="page-header">
                <template #content>
                    <div class="page-title">
                        <h1>知识图谱管理</h1>
                        <p class="subtitle">管理您的知识图谱</p>
                    </div>
                </template>
            </el-page-header>
        </el-card>

        <!-- 2. 课程列表卡片 -->
        <el-card class="course-list-card" v-loading="loading" shadow="never">
            <template #header>
                <div class="card-header">
                    <span class="header-title">课程与任务列表</span>
                </div>
            </template>

            <el-collapse v-model="activeCourseNames">
                <el-collapse-item
                    v-for="course in courseList"
                    :key="course.id"
                    :name="course.id.toString()"
                >
                    <template #title>
                        <div class="custom-title">
                            <span>{{ course.name }}</span>
                            <el-button
                                class="add-task-btn"
                                type="primary"
                                link
                                @click="navigateTo(course.id)"
                            >
                                <el-icon><Plus /></el-icon>
                                编辑知识图谱
                            </el-button>
                        </div>
                    </template>
                </el-collapse-item>
            </el-collapse>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";

// --- 1. 定义数据类型 ---
type TaskType = "PRACTICAL_PROJECT" | "VIDEO_WATCHING" | "TEST_ANSWERING";

interface Task {
    id: number;
    name: string;
    description: string;
    type: TaskType;
    deadline: string | null; // 修改为允许 null
    course_id: number;
}

interface Course {
    id: number;
    name: string;
    point: number;
    classHour: number;
    teacher_id: number;
    teacher_school: string;
    tasks: Task[];
}

// --- 2. 定义响应式数据 ---
const route = useRoute();
const router = useRouter(); // 添加 useRouter 用于返回
const activeCourseNames = ref<string[]>([]);
const courseList = ref<Course[]>([]);
const loading = ref(false);

const fetchAllData = async () => {
    loading.value = true;
    try {
        const { school, uid } = route.params;
        const courseResponse = await axios.get<Course[]>(
            `http://localhost:8082/Task/listcourse/${school}/${uid}`
        );
        const courses = courseResponse.data;
        const coursesWithTasks = await Promise.all(
            courses.map(async (course) => {
                try {
                    const taskResponse = await axios.post<Task[]>(
                        `http://localhost:8082/Task/course/${course.id}`
                    );
                    return { ...course, tasks: taskResponse.data };
                } catch (taskError) {
                    console.error(
                        `获取课程 ${course.name} (ID:${course.id}) 的任务失败:`,
                        taskError
                    );
                    return { ...course, tasks: [] };
                }
            })
        );
        courseList.value = coursesWithTasks;
    } catch (error) {
        console.error("获取课程列表失败:", error);
        ElMessage.error("加载数据失败，请检查后端服务或网络连接");
    } finally {
        loading.value = false;
    }
};

// 【新增】返回上一页
const goBack = () => {
    router.go(-1);
};

function navigateTo(id: number) {
    router.push({
        name: "teacher_knowledge_graph",
        params: { cid: id },
    });
}

onMounted(() => {
    fetchAllData();
});
</script>

<!-- 样式部分已修改 -->
<style scoped>
.course-task-list-container {
    min-height: 100vh;
    background-color: #f5f7fa; /* 添加浅灰色背景 */
    padding: 20px;
    margin-left: 50px;
    width: calc(100% - 100px);
    box-sizing: border-box;
}

/* 1. 页面标题卡片样式 */
.page-header-card {
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

/* 2. 课程列表卡片样式 */
.course-list-card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    border: none;
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

/* 折叠面板和表格样式 */
:deep(.el-collapse) {
    border: none;
}

:deep(.el-collapse-item__header) {
    background-color: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    border-radius: 6px;
    margin-bottom: 8px;
    padding: 0 20px;
}

:deep(.el-collapse-item__content) {
    padding: 0;
    margin-bottom: 16px;
}

.custom-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    font-size: 16px;
    font-weight: 500;
    color: #374151;
}

.add-task-btn {
    margin-right: 20px;
    font-weight: normal;
}

/* 对话框样式 */
.dialog-footer {
    display: flex;
    justify-content: center;
    gap: 12px;
}
</style>
