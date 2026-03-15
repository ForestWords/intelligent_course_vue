<template><button @click="show">send</button></template>
<script setup lang="ts">
import { ElMessage } from "element-plus";
import axios from "axios";
const show = async () => {
    try {
        const params = new URLSearchParams();
        params.append("name", "jaychou");
        params.append("s_course_id", "1");
        params.append("s_resource_id", "1");

        const response_edge = await axios.post(
            "http://localhost:8082/generate",
            params
        );
    } catch (error) {
        ElMessage.error("登录请求失败，请检查网络连接");
    }
};
</script>
