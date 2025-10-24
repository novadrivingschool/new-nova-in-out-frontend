// stores/posts/posts.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { fakeDatabase } from '../fakeDatabase/fakeDatabase'


// types/posts/posts.ts
export interface Post {
    id: number;
    title: string;
    by: string;
    date: string;
    time: string;
    link: string;
    status: 'approved' | 'not approved';
}


export const usePostStore = defineStore('posts', () => {
    const posts = ref<Post[]>([...fakeDatabase.posts]);
    const filter = ref<'all' | 'approved' | 'not approved'>('all');
    const approvalNote = ref('');
    const selectedPost = ref<Post | null>(null);

    const filteredPosts = computed(() => {
        if (filter.value === 'all') return posts.value;
        return posts.value.filter(p => p.status === filter.value);
    });

    function approvePost(note: string) {
        if (selectedPost.value) {
            selectedPost.value.status = 'approved';
            console.log('Approved with note:', note);
            refreshList();
        }
    }

    function rejectPost(note: string) {
        if (selectedPost.value) {
            selectedPost.value.status = 'not approved';
            console.log('Rejected with note:', note);
            refreshList();
        }
    }

    function refreshList() {
        posts.value = [...posts.value];
    }

    function openApproval(post: Post) {
        selectedPost.value = post;
        approvalNote.value = '';
    }

    return {
        posts,
        filter,
        approvalNote,
        selectedPost,
        filteredPosts,
        approvePost,
        rejectPost,
        openApproval
    };
});
