import { ref } from 'vue'
// 侧边栏状态
const sidebarStatus = ref(false)
// 弹窗状态
const confirmStatus = ref(false)
export default function usePupStatus() {
    return {
        sidebarStatus,
        confirmStatus,
    }
}