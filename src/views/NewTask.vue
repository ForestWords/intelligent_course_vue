<template>
    <div class="task-form-container">
        <el-form
            ref="taskFormRef"
            :model="task"
            :rules="rules"
            label-width="120px"
            status-icon
        >
            <el-form-item label="任务名称" prop="name">
                <el-input v-model="task.name" placeholder="请输入任务名称" />
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
                    value-format="YYYY-MM-DDTHH:mm:ssZ"
                />
            </el-form-item>

            <el-form-item label="课程ID" prop="course_id">
                <el-input-number
                    v-model="task.course_id"
                    :min="1"
                    placeholder="请输入课程ID"
                />
            </el-form-item>

            <el-form-item>
                <!-- 提交按钮，点击时触发 submitForm 方法 -->
                <el-button type="primary" @click="submitForm" :loading="loading"
                    >创建任务</el-button
                >
                <el-button @click="resetForm">重置</el-button>
            </el-form-item>
        </el-form>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import axios from "axios";

// 2. 定义任务类型枚举和接口
enum TaskType {
    PRACTICAL_PROJECT = "PRACTICAL_PROJECT",
    VIDEO_WATCHING = "VIDEO_WATCHING",
    TEST_ANSWERING = "TEST_ANSWERING",
}

// --- 修改点 1: 在 Task 接口中添加 id 属性 ---
interface Task {
    id: number; // 添加 id 属性
    name: string;
    description: string;
    type: TaskType | "";
    deadline: string;
    course_id: number | null;
}

// 3. 获取表单引用，用于触发验证
const taskFormRef = ref<FormInstance>();

// 4. 创建响应式数据
// --- 修改点 2: 在初始化 task 对象时，设置 id 为 1 ---
const task = reactive<Task>({
    id: 0, // 设置 id 为常数 1
    name: "",
    description: "",
    type: "",
    deadline: "",
    course_id: null,
});

// 5. 定义表单验证规则 (确保所有字段都是必填的)
const rules = reactive<FormRules<Task>>({
    // 注意：id 是常数，通常不需要验证，所以这里没有 id 的规则
    name: [{ required: true, message: "任务名称不能为空", trigger: "blur" }],
    description: [
        { required: true, message: "任务描述不能为空", trigger: "blur" },
    ],
    type: [{ required: true, message: "请选择任务类型", trigger: "change" }],
    deadline: [
        { required: true, message: "请选择截止日期", trigger: "change" },
    ],
    course_id: [
        { required: true, message: "课程ID不能为空", trigger: "blur" },
        { type: "number", min: 1, message: "课程ID必须大于0", trigger: "blur" },
    ],
});

// 6. 为下拉框提供选项
const typeOptions = [
    { value: TaskType.PRACTICAL_PROJECT, label: "实践课程" },
    { value: TaskType.VIDEO_WATCHING, label: "视频观看" },
    { value: TaskType.TEST_ANSWERING, label: "测试答题" },
];

// 7. 定义一个加载状态，用于防止重复提交和给用户反馈
const loading = ref(false);

// 8. 提交表单的方法 (核心逻辑)
const submitForm = async () => {
    if (!taskFormRef.value) return;

    // 步骤 A: 表单验证
    await taskFormRef.value.validate((valid, fields) => {
        if (valid) {
            // 步骤 B: 验证通过，准备发送请求
            console.log("表单验证通过，准备提交的数据:", task);
            sendCreateTaskRequest();
        } else {
            // 步骤 C: 验证失败，提示用户
            console.log("表单验证失败", fields);
            ElMessage.error("请检查表单输入，所有字段均为必填项！");
        }
    });
};

// 9. 发送请求的独立方法
const sendCreateTaskRequest = async () => {
    loading.value = true; // 开启加载状态
    try {
        // *** 关键部分：向后端发送 POST 请求 ***
        // 现在发送的 task 对象会包含 { id: 1, name: '...', ... }
        const response = await axios.post(
            "http://localhost:8082/Task/create",
            task
        );

        // 请求成功后的处理
        if (response.data == 0) {
            ElMessage.success("任务创建成功！");
            resetForm(); // 成功后重置表单
        } else {
            ElMessage.error("课程不存在。");
        }
    } catch (error) {
        // 请求失败后的处理
        console.error("创建任务失败:", error);
        // 可以根据 error.response.status 显示更具体的错误信息
        ElMessage.error("创建任务失败，请稍后再试或联系管理员。");
    } finally {
        loading.value = false; // 无论成功失败，都关闭加载状态
    }
};

// 10. 重置表单的方法
const resetForm = () => {
    if (!taskFormRef.value) return;
    taskFormRef.value.resetFields();
    // 重置后，id 会被恢复为初始值 1
    task.id = 0;
};
</script>

<style scoped>
.task-form-container {
    max-width: 600px;
    margin: 20px auto;
    padding: 20px;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>
