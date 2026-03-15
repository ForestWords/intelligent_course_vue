import { createRouter, createWebHashHistory } from "vue-router";
import Login from "../views/Login.vue";
import Register from "../views/Register.vue";
import User from "../views/User.vue";
import StudentCourse from "../views/StudentCourse.vue";
import TeacherCourse from "../views/TeacherCourse.vue";
import TaskList from "../views/TaskList.vue";
import TaskScore from "../views/TaskScore.vue";
import Resource from "../views/Resource.vue";
import TeacherKnowledgeGraphList from "../views/TeacherKnowledgeGraphList.vue";
import TeacherKnowledgeGraph from "../views/TeacherKnowledgeGraph.vue";
import Profile from "../views/Profile.vue";
import CourseList from "../views/CourseList.vue";
import StudentList from "../views/StudentList.vue";
import grade from "../views/grade.vue";

const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: "/",
            redirect: "/login",
        },
        {
            path: "/login",
            name: "login",
            component: Login,
        },
        {
            path: "/register",
            name: "register",
            component: Register,
        },
        {
            path: "/user/:school/:uid",
            name: "user",
            component: User,
            children: [
                {
                    path: "student_course",
                    name: "student_course",
                    component: StudentCourse,
                },
                {
                    path: "teacher_course",
                    name: "teacher_course",
                    component: TeacherCourse,
                    
                },
                {
                    path:"TaskList",
                    name: "TaskList",
                    component: TaskList,
                },
                {
                    path: "TaskScore",
                    name: "TaskScore",
                    component: TaskScore,
                },
                                {
                    path: "grade/:id",
                    name: "grade",
                    component: grade,
                },
                {
                    path: "Resource",
                    name: "Resource",
                    component: Resource,
                },
                {
                    path: "StudentList",
                    name: "StudentList",
                    component: StudentList,
                },

                {
                    path: "teacher_knowledge_graph_list",
                    name: "teacher_knowledge_graph_list",
                    component: TeacherKnowledgeGraphList,
                },
        {
          path: 'Profile',
          name: 'Profile',
          component: Profile // 为 "我的" 添加组件
        },
                        {
                    path: "course_list/:cid",
                    name: "course_list",
                    component: CourseList,
                    children: [
                        {
                            path: "teacher_knowledge_graph",
                            name: "teacher_knowledge_graph",
                            component: TeacherKnowledgeGraph,
                        },
                    ],
                },
                
            ],
        },
    ],
});

export default router;
