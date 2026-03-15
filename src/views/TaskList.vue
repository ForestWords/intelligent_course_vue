<template>
    <!-- Template部分保持不变 -->
    <div class="course-task-list-container">
        <!-- 1. 页面标题卡片 -->
        <el-card class="page-header-card" shadow="never">
            <el-page-header @back="goBack" class="page-header">
                <template #content>
                    <div class="page-title">
                        <h1>教学任务管理</h1>
                        <p class="subtitle">
                            管理您的教学任务，轻松掌握教学进度
                        </p>
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

            <el-collapse
                v-model="activeCourseNames"
                @change="handleCourseChange"
            >
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
                                @click.stop="openCreateTaskDialog(course)"
                            >
                                <el-icon><Plus /></el-icon>
                                添加任务
                            </el-button>
                        </div>
                    </template>

                    <el-table
                        :data="course.tasks"
                        style="width: 100%"
                        :border="true"
                        size="small"
                    >
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

                        <el-table-column
                            label="操作"
                            width="180"
                            align="center"
                        >
                            <template #default="scope">
                                <el-button
                                    link
                                    type="primary"
                                    size="small"
                                    @click="openViewTaskDialog(scope.row)"
                                    >查看</el-button
                                >
                                <el-button
                                    link
                                    type="danger"
                                    size="small"
                                    @click="handleDeleteTask(scope.row)"
                                    >删除</el-button
                                >
                                <el-button
                                    link
                                    type="success"
                                    size="small"
                                    @click="handleReleaseTask(scope.row)"
                                    >发布</el-button
                                >
                            </template>
                        </el-table-column>
                    </el-table>

                    <el-empty
                        v-if="!course.tasks || course.tasks.length === 0"
                        description="该课程下暂无任务"
                        :image-size="100"
                    />
                </el-collapse-item>
            </el-collapse>
        </el-card>

        <!-- 1. 创建任务的对话框 -->
        <el-dialog
            v-model="dialogVisible"
            title="添加新任务"
            width="500px"
            @close="resetTaskForm"
        >
            <el-form
                ref="taskFormRef"
                :model="task"
                :rules="rules"
                label-width="100px"
                status-icon
            >
                <el-form-item label="任务名称" prop="name">
                    <el-input
                        v-model="task.name"
                        placeholder="请输入任务名称"
                    />
                </el-form-item>

                <el-form-item label="任务描述" prop="description">
                    <el-input
                        v-model="task.description"
                        type="textarea"
                        rows="4"
                        placeholder="请输入任务描述"
                    />
                </el-form-item>

                <el-form-item label="任务类型" prop="type">
                    <el-select v-model="task.type" placeholder="请选择任务类型">
                        <el-option
                            v-for="typeOption in typeOptions"
                            :key="typeOption.value"
                            :label="typeOption.label"
                            :value="typeOption.value"
                        />
                    </el-select>
                </el-form-item>

                <el-form-item label="截止日期" prop="deadline">
                    <el-date-picker
                        v-model="task.deadline"
                        type="datetime"
                        placeholder="选择日期和时间"
                        format="YYYY-MM-DD HH:mm:ss"
                        value-format="YYYY-MM-DD HH:mm:ss"
                    />
                </el-form-item>
            </el-form>

            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button
                        type="primary"
                        @click="handleNextStep"
                        :loading="submitting"
                        >下一步</el-button
                    >
                </span>
            </template>
        </el-dialog>

        <!-- 2. 选择知识点的对话框 -->
        <el-dialog
            v-model="selectKnowledgeVisible"
            title="选择关联的知识点"
            width="600px"
            align-center
        >
            <el-transfer
                v-model="selectedKnowledgeNames"
                :data="knowledgeOptions"
                :titles="['可选知识点', '已选知识点']"
                filterable
                :filter-placeholder="'请输入知识点名称'"
            />
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="handleCancelSelection">取消</el-button>
                    <el-button
                        type="primary"
                        @click="handleFinishSelection"
                        :loading="submitting"
                        >完成</el-button
                    >
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from "vue";
import {
    ElMessage,
    ElMessageBox,
    type FormInstance,
    type FormRules,
} from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import dayjs from "dayjs";

// --- 1. 定义数据类型 ---
type TaskType = "PRACTICAL_PROJECT" | "VIDEO_WATCHING" | "TEST_ANSWERING";

interface Task {
    id: number;
    name: string;
    description: string;
    type: TaskType;
    deadline: string | null;
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

// 【关键修改】知识点接口，移除 id，name 为主键
interface KnowledgePoint {
    name: string; // name 现在是主键
    description: string;
    resource_id: number;
    course_id: number;
    task_id: number;
}

// --- 2. 定义响应式数据 ---
const route = useRoute();
const router = useRouter();
const activeCourseNames = ref<string[]>([]);
const courseList = ref<Course[]>([]);
const loading = ref(false);

// --- 3. 对话框相关的响应式数据 ---
const dialogVisible = ref(false);
const selectKnowledgeVisible = ref(false);
const taskFormRef = ref<FormInstance>();
const submitting = ref(false);
const isReadonly = ref(false);

// 选择知识点对话框相关的数据
const knowledgeOptions = ref<
    { key: string; label: string; disabled: boolean }[]
>([]);
// 【关键修改】变量名和类型都改为字符串数组
const selectedKnowledgeNames = ref<string[]>([]);

// 【新增】用于保存创建任务后返回的ID
const createdTaskId = ref<number | null>(null);

// --- 4. 任务表单数据 ---
const task = reactive<Task>({
    id: 0,
    name: "",
    description: "",
    type: "PRACTICAL_PROJECT",
    deadline: null,
    course_id: 0,
});

// --- 5. 表单验证规则 ---
const rules = reactive<FormRules<Task>>({
    name: [{ required: true, message: "任务名称不能为空" }],
    description: [{ required: true, message: "任务描述不能为空" }],
    type: [{ required: true, message: "请选择任务类型" }],
    deadline: [{ required: true, message: "请选择截止日期" }],
});

// --- 6. 任务类型选项 ---
const typeOptions = [
    { value: "PRACTICAL_PROJECT", label: "实践课程" },
    { value: "VIDEO_WATCHING", label: "视频观看" },
    { value: "TEST_ANSWERING", label: "测试答题" },
];

// --- 7. 方法定义 ---
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

const handleCourseChange = (activeNames: string[]) => {
    console.log("当前展开的课程:", activeNames);
};

const handleDeleteTask = async (taskToDelete: Task) => {
    try {
        await ElMessageBox.confirm(
            `确定要删除任务 "${taskToDelete.name}" 吗？此操作不可恢复。`,
            "删除确认",
            {
                confirmButtonText: "确定",
                cancelButtonText: "取消",
                type: "warning",
            }
        );
        ElMessage.info("正在删除任务...");
        await axios.delete(
            `http://localhost:8082/Task/delete/${taskToDelete.id}`
        );
        ElMessage.success("任务删除成功！");
        await fetchAllData();
    } catch (error) {
        if (error !== "cancel") {
            console.error("删除任务失败:", error);
            ElMessage.error("删除任务失败，请稍后再试。");
        }
    }
};

const handleReleaseTask = async (taskToRelease: Task) => {
    try {
        const { school, uid } = route.params;
        await axios.post(
            `http://localhost:8082/Task/release/${taskToRelease.id}/${school}`
        );
        ElMessage.success("任务发布成功！");
        await fetchAllData();
    } catch (error) {
        if (error !== "cancel") {
            console.error("发布任务失败:", error);
            ElMessage.error("发布任务失败，请稍后再试。");
        }
    }
};

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

const goBack = () => {
    router.go(-1);
};

// 【修改】直接打开创建任务对话框
const openCreateTaskDialog = (course: Course) => {
    task.course_id = course.id; // 预设课程ID
    dialogVisible.value = true; // 打开创建任务对话框
};

// 【关键修改】处理“下一步”按钮，在这里创建任务
const handleNextStep = async () => {
    if (!taskFormRef.value) return;

    await taskFormRef.value.validate(async (valid) => {
        if (valid) {
            submitting.value = true;
            try {
                const createTaskResponse = await axios.post<number>(
                    "http://localhost:8082/Task/create",
                    {
                        name: task.name,
                        description: task.description,
                        type: task.type,
                        deadline: task.deadline,
                        course_id: task.course_id,
                    }
                );

                const newTaskId = createTaskResponse.data;

                if (newTaskId && newTaskId > 0) {
                    // 任务创建成功，保存ID
                    createdTaskId.value = newTaskId;
                    ElMessage.success("任务创建成功！请选择关联的知识点。");

                    // 加载知识点列表
                    try {
                        const response = await axios.get<KnowledgePoint[]>(
                            `http://localhost:8082/Task/KnowledgePoint/list/${task.course_id}`
                        );
                        // 【关键修改】将 name 作为 key 和 label
                        knowledgeOptions.value = response.data.map((kp) => ({
                            key: kp.name,
                            label: kp.name,
                            disabled: false,
                        }));
                        selectedKnowledgeNames.value = []; // 清空之前的选择
                        dialogVisible.value = false; // 关闭创建任务对话框
                        selectKnowledgeVisible.value = true; // 打开选择知识点对话框
                    } catch (error) {
                        ElMessage.error("获取知识点列表失败，无法关联知识点。");
                        console.error("获取知识点列表失败:", error);
                    }
                } else {
                    ElMessage.error("创建任务失败，后端返回了无效的ID。");
                }
            } catch (error) {
                console.error("创建任务失败:", error);
                ElMessage.error("创建任务失败，请检查网络或联系管理员。");
            } finally {
                submitting.value = false;
            }
        } else {
            ElMessage.error("请检查表单输入！");
        }
    });
};

// 【新增】完成选择，关联知识点
const handleFinishSelection = async () => {
    if (!createdTaskId.value) {
        ElMessage.error("任务ID丢失，无法关联知识点。");
        return;
    }

    submitting.value = true;
    try {
        if (selectedKnowledgeNames.value.length > 0) {
            ElMessage.info("正在关联知识点...");
            // 【关键修改】将字符串数组转换为逗号分隔的字符串
            const pointNamesString = selectedKnowledgeNames.value.join(";");
            await axios.post(
                `http://localhost:8082/Task/addpoint/${createdTaskId.value}`,
                null,
                {
                    params: {
                        // 【重要】参数名可能需要改为 pointName，请与后端确认
                        pointName: pointNamesString,
                    },
                }
            );
        }

        ElMessage.success("任务创建并关联知识点成功！");
        selectKnowledgeVisible.value = false;
        await fetchAllData(); // 刷新列表
    } catch (error) {
        console.error("关联知识点失败:", error);
        ElMessage.error("关联知识点失败，请检查网络或联系管理员。");
    } finally {
        submitting.value = false;
        resetAll(); // 最终重置所有状态
    }
};

// 【新增】取消选择，删除已创建的任务
const handleCancelSelection = async () => {
    if (createdTaskId.value) {
        try {
            await axios.delete(
                `http://localhost:8082/Task/delete/${createdTaskId.value}`
            );
            ElMessage.info("已取消创建，并删除了未关联知识点的任务。");
        } catch (error) {}
    }
    selectKnowledgeVisible.value = false;
    resetAll();
};

// 【修改】打开查看任务对话框
const openViewTaskDialog = (taskToView: Task) => {
    isReadonly.value = true;
    resetTaskForm();
    Object.assign(task, taskToView);
    dialogVisible.value = true;
};

// 【修改】重置任务表单的方法
const resetTaskForm = () => {
    if (!taskFormRef.value) return;
    taskFormRef.value.resetFields();
    task.id = 0;
    task.course_id = 0;
    task.deadline = null;
};

// 【新增】重置所有相关状态
const resetAll = () => {
    resetTaskForm();
    createdTaskId.value = null;
    selectedKnowledgeNames.value = []; // 【修改】重置为空字符串数组
    knowledgeOptions.value = []; // 【修改】重置知识点列表
    isReadonly.value = false;
};

// --- 生命周期钩子 ---
onMounted(() => {
    fetchAllData();
});
</script>

<!-- 样式部分保持不变 -->
<style scoped>
/* ... 你的样式代码 ... */
.course-task-list-container {
    min-height: 100vh;
    background-color: #f5f7fa;
    padding: 20px;
    margin-left: 50px;
    width: calc(100% - 100px);
    box-sizing: border-box;
}

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

:deep(.el-collapse) {
    border: none;
    padding: 0 32px;
    box-sizing: border-box;
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

.dialog-footer {
    display: flex;
    justify-content: center;
    gap: 12px;
}
</style>
