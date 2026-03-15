<template>
    <el-container>
        <el-aside class="sidebar-fixed"><NavMenu /></el-aside>
        <el-container>
            <el-header class="header"
                ><span>欢迎来到智慧课堂</span
                ><span>{{ currentUser.name }}</span></el-header
            >
            <el-main>
                <RouterView />
            </el-main>
        </el-container>
    </el-container>
</template>

<script setup lang="ts">
import NavMenu from "../components/navigation/NavMenu.vue";
import { ref, onMounted } from "vue";

const getCurrentUser = () => {
    const userStr = localStorage.getItem("currentUser");
    return userStr ? JSON.parse(userStr) : null;
};

let currentUser = ref(getCurrentUser());

onMounted(() => {
    currentUser = ref(getCurrentUser());
    window.addEventListener("storage", (event) => {
        if (event.key === "currentUser") {
            currentUser = ref(getCurrentUser());
        }
    });
});
</script>

<style scoped lang="scss">
.header {
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    justify-content: space-between; /* 添加这行 */
    color: #00aeec;
    padding: 6px;
    border-radius: 4px;
    background-color: #fff; /* 与菜单背景色相同 */
    font-size: 20px; /* 增大字体大小 */
    font-weight: 600; /* 增加字体粗细，使其更醒目 */
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);
}
.sidebar-fixed {
    width: 160px;
}
</style>
