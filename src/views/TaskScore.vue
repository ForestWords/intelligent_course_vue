<template>
    <div class="course-task-list-container">
        <!-- 1. 页面标题卡片 -->
        <el-card class="page-header-card" shadow="never">
            <el-page-header @back="goBack" class="page-header">
                <template #content>
                    <div class="page-title">
                        <h1>教学任务管理</h1>
                        <p class="subtitle">
                            批改您的教学任务，轻松掌握教学进度
                        </p>
                    </div>
                </template>
            </el-page-header>
        </el-card>
        <!-- 2. 任务列表卡片 -->
        <el-card class="task-list-card" v-loading="loading" shadow="never">
            <!-- 搜索区域 -->
            <template #header>
                <div class="card-header">
                    <span class="header-title">任务列表</span>
                    <!-- 【移除】搜索框，因为没有课程名称可供搜索 -->
                </div>
            </template>

            <!-- 使用 Tabs 拆分任务列表 -->
            <el-tabs
                v-model="activeTab"
                class="task-tabs"
                @tab-change="handleTabChange"
            >
                <!-- 未批改任务 -->
                <el-tab-pane label="未批改" name="ungraded">
                    <el-table
                        :data="ungradedTasks"
                        style="width: 100%"
                        :border="true"
                        size="small"
                    >
                        <el-table-column
                            type="index"
                            width="60"
                            label="序号"
                            align="center"
                        />
                        <el-table-column
                            prop="name"
                            label="任务名称"
                            min-width="150"
                        />
                        <el-table-column
                            label="任务描述"
                            min-width="200"
                            show-overflow-tooltip
                        >
                            <template #default="scope">
                                {{ getFirstLine(scope.row.description) }}
                            </template>
                        </el-table-column>
                        <el-table-column
                            prop="type"
                            label="任务类型"
                            width="120"
                            align="center"
                        >
                            <template #default="scope">
                                <el-tag :type="getTaskTypeTag(scope.row.type)">
                                    {{ getTaskTypeLabel(scope.row.type) }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column
                            prop="deadline"
                            label="截止日期"
                            width="180"
                            align="center"
                        >
                            <template #default="scope">
                                {{
                                    scope.row.deadline
                                        ? dayjs(scope.row.deadline).format(
                                              "YYYY-MM-DD HH:mm:ss"
                                          )
                                        : "未设置"
                                }}
                            </template>
                        </el-table-column>
                        <!-- 【移除】所属课程列 -->
                        <el-table-column
                            label="操作"
                            width="120"
                            align="center"
                            fixed="right"
                        >
                            <template #default="scope">
                                <el-button
                                    type="primary"
                                    size="small"
                                    @click="handleGradeTask(scope.row)"
                                >
                                    批改任务
                                </el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                    <el-empty
                        v-if="!ungradedTasks || ungradedTasks.length === 0"
                        description="暂无未批改任务"
                        :image-size="100"
                    />
                </el-tab-pane>

                <!-- 已批改任务 -->
                <el-tab-pane label="已批改" name="graded">
                    <el-table
                        :data="gradedTasks"
                        style="width: 100%"
                        :border="true"
                        size="small"
                    >
                        <el-table-column
                            type="index"
                            width="60"
                            label="序号"
                            align="center"
                        />
                        <el-table-column
                            prop="name"
                            label="任务名称"
                            min-width="150"
                        />
                        <el-table-column
                            label="任务描述"
                            min-width="200"
                            show-overflow-tooltip
                        >
                            <template #default="scope">
                                {{ getFirstLine(scope.row.description) }}
                            </template>
                        </el-table-column>
                        <el-table-column
                            prop="type"
                            label="任务类型"
                            width="120"
                            align="center"
                        >
                            <template #default="scope">
                                <el-tag :type="getTaskTypeTag(scope.row.type)">
                                    {{ getTaskTypeLabel(scope.row.type) }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column
                            prop="deadline"
                            label="截止日期"
                            width="180"
                            align="center"
                        >
                            <template #default="scope">
                                {{
                                    scope.row.deadline
                                        ? dayjs(scope.row.deadline).format(
                                              "YYYY-MM-DD HH:mm:ss"
                                          )
                                        : "未设置"
                                }}
                            </template>
                        </el-table-column>
                        <!-- 【移除】所属课程列 -->
                        <!-- 得分列 -->

                        <el-table-column
                            label="操作"
                            width="120"
                            align="center"
                            fixed="right"
                        >
                            <template #default="scope">
                                <el-button
                                    type="primary"
                                    size="small"
                                    @click="handleViewGrade(scope.row)"
                                >
                                    下载成绩
                                </el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                    <el-empty
                        v-if="!gradedTasks || gradedTasks.length === 0"
                        description="暂无已批改任务"
                        :image-size="100"
                    />
                </el-tab-pane>
            </el-tabs>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import dayjs from "dayjs";

// --- 1. 定义数据类型 ---
type TaskType = "PRACTICAL_PROJECT" | "VIDEO_WATCHING" | "TEST_ANSWERING";

// 【修改】Task 接口，移除 courseName
interface Task {
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
const activeTab = ref("ungraded");
const ungradedTasks = ref<Task[]>([]); // 存储未批改任务
const gradedTasks = ref<Task[]>([]); // 存储已批改任务
const loading = ref(false);

// --- 3. 方法定义 ---
const getFirstLine = (text: string): string => {
    if (!text) return "";
    return text.split("\n")[0];
};

const getTaskTypeTag = (type: TaskType): string => {
    const tagMap = {
        PRACTICAL_PROJECT: "success",
        VIDEO_WATCHING: "warning",
        TEST_ANSWERING: "danger",
    };
    return tagMap[type] || "info";
};

const getTaskTypeLabel = (type: TaskType): string => {
    const labelMap = {
        PRACTICAL_PROJECT: "实践课程",
        VIDEO_WATCHING: "视频观看",
        TEST_ANSWERING: "测试答题",
    };
    return labelMap[type] || "未知类型";
};

const goBack = () => {
    router.go(-1);
};

// 【移除】handleSearch 函数，因为不再需要搜索

// 【新增】标签页切换时加载数据
const handleTabChange = (tabName: string) => {
    if (tabName === "ungraded" && ungradedTasks.value.length === 0) {
        fetchUngradedTasks();
    } else if (tabName === "graded" && gradedTasks.value.length === 0) {
        fetchGradedTasks();
    }
};

const handleGradeTask = (taskToGrade: Task) => {
    ElMessage.info(`正在准备批改任务: "${taskToGrade.name}"`);
    router.push(`grade/${taskToGrade.id}`);
};

const handleViewGrade = async (taskToView: Task) => {
    ElMessage.info(`正在准备下载任务 "${taskToView.name}" 的成绩单...`);

    window.open(`http://localhost:8082/Task/score/${taskToView.id}`, "_blank");
    ElMessage.success("开始下载文件");
};

// 【修改】获取未批改的任务列表
const fetchUngradedTasks = async () => {
    loading.value = true;
    try {
        const { school, uid } = route.params;
        // 假设后端接口直接返回任务列表，不再包含 courseName
        const response = await axios.get<Task[]>(
            `http://localhost:8082/Task/list/ungraded/${school}/${uid}`
        );
        ungradedTasks.value = response.data;
    } catch (error) {
        console.error("获取未批改任务失败:", error);
        ElMessage.error("加载未批改任务失败，请检查后端服务或网络连接");
    } finally {
        if (activeTab.value === "ungraded") {
            loading.value = false;
        }
    }
};

// 【修改】获取已批改的任务列表
const fetchGradedTasks = async () => {
    loading.value = true;
    try {
        const { school, uid } = route.params;
        // 假设后端接口直接返回任务列表，不再包含 courseName
        const response = await axios.get<Task[]>(
            `http://localhost:8082/Task/list/graded/${school}/${uid}`
        );
        gradedTasks.value = response.data;
    } catch (error) {
        console.error("获取已批改任务失败:", error);
        ElMessage.error("加载已批改任务失败，请检查后端服务或网络连接");
    } finally {
        if (activeTab.value === "graded") {
            loading.value = false;
        }
    }
};

// 【移除】filteredUngradedTasks 和 filteredGradedTasks 计算属性，因为不再需要搜索

// --- 生命周期钩子 ---
onMounted(() => {
    // 初始只加载未批改任务的数据
    fetchUngradedTasks();
});
</script>

<!-- 样式部分保持不变 -->
<style scoped>
.course-task-list-container {
    min-height: 100vh;
    background-color: #f5f7fa;
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

/* 2. 任务列表卡片样式 */
.task-list-card {
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

/* Tabs 样式 */
.task-tabs {
    margin-top: -20px;
}

.task-tabs :deep(.el-tabs__header) {
    margin: 0;
    padding: 0 20px;
    background-color: #fafbfc;
    border-bottom: 1px solid #e5e7eb;
}

.task-tabs :deep(.el-tabs__content) {
    padding: 20px;
}
</style>
