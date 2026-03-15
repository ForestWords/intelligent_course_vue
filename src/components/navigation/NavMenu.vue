<template>
    <!-- 【修改】最外层包裹器，用于固定定位 -->
    <div class="sidebar-fixed">
        <el-row class="tac">
            <el-col :span="24" background-color="#545c64">
                <h5 class="mb-2 title-center">导航栏</h5>

                <!-- 学生菜单 -->
                <el-menu
                    v-if="isstudent"
                    active-text-color="#ffd04b"
                    background-color="#545c64"
                    class="el-menu-vertical-demo"
                    :default-active="$route.path"
                    text-color="#fff"
                    @open="handleOpen"
                    @close="handleClose"
                    router
                >
                    <el-menu-item index="student_course_list">
                        <template #title>
                            <el-icon><Calendar /></el-icon>
                            <span>课程</span>
                        </template>
                    </el-menu-item>
                    <el-sub-menu index="2">
                        <template #title>
                            <el-icon><icon-menu /></el-icon>
                            <span>任务</span>
                        </template>
                        <el-menu-item index="2-1"
                            ><el-icon><List /></el-icon>任务列表</el-menu-item
                        >
                    </el-sub-menu>
                    <el-menu-item index="3">
                        <el-icon><Box /></el-icon>
                        <span>资源</span>
                    </el-menu-item>
                    <el-menu-item index="4">
                        <el-icon><PictureRounded /></el-icon>
                        <span>知识图谱</span>
                    </el-menu-item>
                </el-menu>

                <!-- 教师菜单 -->
                <el-menu
                    v-else
                    active-text-color="#ffd04b"
                    background-color="#545c64"
                    class="el-menu-vertical-demo"
                    :default-active="$route.path"
                    text-color="#fff"
                    @open="handleOpen"
                    @close="handleClose"
                    router
                >
                    <el-sub-menu index="1">
                        <template #title>
                            <el-icon><Calendar /></el-icon>
                            <span>课程</span>
                        </template>
                        <el-menu-item index="teacher_course"
                            ><el-icon><List /></el-icon>课程管理</el-menu-item
                        >
                        <el-menu-item index="StudentList"
                            ><el-icon><finished /></el-icon
                            >学生管理</el-menu-item
                        >
                    </el-sub-menu>
                    <el-sub-menu>
                        <template #title>
                            <el-icon><icon-menu /></el-icon>
                            <span>任务</span>
                        </template>
                        <el-menu-item index="TaskList"
                            ><el-icon><List /></el-icon>任务列表</el-menu-item
                        >
                        <el-menu-item index="TaskScore"
                            ><el-icon><finished /></el-icon
                            >智能任务批改</el-menu-item
                        >
                    </el-sub-menu>
                    <el-menu-item index="Resource">
                        <el-icon><Box /></el-icon>
                        <span>资源</span>
                    </el-menu-item>
                    <el-menu-item index="teacher_knowledge_graph_list">
                        <el-icon><PictureRounded /></el-icon>
                        <span>知识图谱</span>
                    </el-menu-item>
                    <el-menu-item class="logout-menu" @click="handleLogout">
                        <el-icon><SwitchButton /></el-icon>
                        <span>退出登录</span>
                    </el-menu-item>
                </el-menu>
            </el-col>
        </el-row>
    </div>
</template>

<script lang="ts" setup>
// ... 脚本部分保持不变 ...
import {
    Calendar,
    Menu as IconMenu,
    Box,
    Setting,
    Finished,
    List,
    PictureRounded,
    SwitchButton,
} from "@element-plus/icons-vue";
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";

const router = useRouter();
const isstudent = ref(false);

const getCurrentUser = () => {
    const userStr = localStorage.getItem("currentUser");
    return userStr ? JSON.parse(userStr) : null;
};

const toTaskChecked = () => {
    window.open("http://localhost:8081/");
};

let currentUser = ref(getCurrentUser());

onMounted(() => {
    currentUser = ref(getCurrentUser());
    window.addEventListener("storage", (event) => {
        if (event.key === "currentUser") {
            currentUser = ref(getCurrentUser());
        }
    });
    if (currentUser.value.type == "student") {
        isstudent.value = true;
    } else {
        isstudent.value = false;
    }
});

const handleOpen = (key: string, keyPath: string[]) => {
    console.log(key, keyPath);
};
const handleClose = (key: string, keyPath: string[]) => {
    console.log(key, keyPath);
};

// 处理退出登录的逻辑
const handleLogout = () => {
    localStorage.removeItem("currentUser");
    ElMessage.success("已成功退出登录");
    router.push("/login");
};
</script>

<style scoped>
/* 【关键修改】侧边栏固定定位样式 */
.sidebar-fixed {
    position: fixed;
    top: 0;
    left: 0;
    width: 160px;
    z-index: 1000;
    background-color: #545c64;
    display: flex;
    flex-direction: column;
}

.tac {
    height: 100vh; /* 使用视口高度单位 */
    overflow: hidden; /* 防止内容溢出 */
    background-color: #545c64;
    border-radius: 4px;
}

.el-menu-vertical-demo {
    border-right: none; /* 可选：移除右边框 */
}

.title-center {
    text-align: center;
    color: #fff;
    margin: 6px;
    padding: 6px;
    background-color: #545c64; /* 与菜单背景色相同 */
    font-size: 20px; /* 增大字体大小 */
    font-weight: 600; /* 增加字体粗细，使其更醒目 */
}
/* 【新增】退出登录菜单项的特殊样式 */
.logout-menu {
    border-right: none;
    margin-top: auto; /* 自动将退出按钮推到菜单底部 */
    color: #f56c6c; /* 红色文字 */
}

/* 使用深度选择器将退出菜单项的文字颜色设为红色 */
.logout-menu :deep(.el-menu-item) {
    color: #f56c6c;
}

/* 设置退出菜单项的悬停和激活背景色 */
.logout-menu :deep(.el-menu-item:hover),
.logout-menu :deep(.el-menu-item.is-active) {
    background-color: rgba(245, 108, 108, 0.1);
    color: #f56c6c;
}
</style>
