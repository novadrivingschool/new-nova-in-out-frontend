<template>
    <v-container fluid class="app-page">
        <div class="app-page-header">
            <div>
                <h1 class="app-page-title">Posts</h1>
                <div class="app-page-subtitle">
                    {{ filteredPosts.length }} {{ filteredPosts.length === 1 ? 'post' : 'posts' }}
                </div>
            </div>

            <v-select
                v-model="localFilter"
                :items="filters"
                label="Filter by status"
                style="min-width: 220px;"
                hide-details
                density="comfortable"
            />
        </div>

        <v-card class="app-card" elevation="0">
            <v-table class="app-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>By</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Preview</th>
                        <th>Status</th>
                        <th class="text-end">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="post in filteredPosts" :key="post.id">
                        <td class="font-weight-medium">{{ post.title }}</td>
                        <td>{{ post.by }}</td>
                        <td>{{ post.date }}</td>
                        <td>{{ post.time }}</td>
                        <td>
                            <v-btn
                                icon="mdi-image-outline"
                                size="small"
                                variant="text"
                                color="primary"
                                @click="openImage(post.link)"
                            />
                        </td>
                        <td>
                            <v-chip
                                :color="post.status === 'approved' ? 'success' : 'warning'"
                                variant="tonal"
                                size="small"
                                class="font-weight-bold text-capitalize"
                            >
                                {{ post.status }}
                            </v-chip>
                        </td>
                        <td class="text-end">
                            <v-btn
                                v-if="post.status !== 'approved'"
                                color="primary"
                                size="small"
                                variant="tonal"
                                @click="openApprovalModal(post)"
                            >
                                Review
                            </v-btn>
                        </td>
                    </tr>
                    <tr v-if="filteredPosts.length === 0">
                        <td colspan="7">
                            <div class="app-empty-state py-8">
                                <v-icon>mdi-post-outline</v-icon>
                                <div class="text-subtitle-2 font-weight-medium">No posts found</div>
                                <div class="text-body-2 mt-1">Try changing the filter.</div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </v-table>
        </v-card>

        <!-- Image Modal -->
        <v-dialog v-model="showImageModal" max-width="700">
            <v-card class="pa-2">
                <v-card-title class="d-flex align-center">
                    <span>Preview</span>
                    <v-spacer />
                    <v-btn icon="mdi-close" variant="text" size="small" @click="showImageModal = false" />
                </v-card-title>
                <v-img :src="currentImage" aspect-ratio="16/9" cover class="rounded-lg ma-2" />
            </v-card>
        </v-dialog>

        <!-- Approval Modal -->
        <v-dialog v-model="showApprovalModal" max-width="520" persistent>
            <v-card class="pa-2">
                <v-card-title class="d-flex align-center ga-2">
                    <v-icon color="primary">mdi-clipboard-check-outline</v-icon>
                    <span>Approve or Reject Post</span>
                    <v-spacer />
                    <v-btn icon="mdi-close" variant="text" size="small" @click="showApprovalModal = false" />
                </v-card-title>
                <v-card-text class="pt-4">
                    <v-textarea v-model="approvalNote" label="Add a note before saving" rows="3" auto-grow />
                </v-card-text>
                <v-card-actions class="px-6 pb-4 ga-2">
                    <v-btn color="error" variant="tonal" @click="rejectPost">Reject</v-btn>
                    <v-spacer />
                    <v-btn variant="text" @click="showApprovalModal = false">Cancel</v-btn>
                    <v-btn color="success" variant="flat" @click="approvePost">Approve</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { usePostStore } from '@/stores/post/post';

const postStore = usePostStore();

const filters = ['all', 'approved', 'not approved'];

const localFilter = ref(postStore.filter);

const filteredPosts = computed(() => {
    if (localFilter.value === 'all') return postStore.posts;
    return postStore.posts.filter(p => p.status === localFilter.value);
});

onMounted(() => {
    postStore.filter = 'all';
});

const showImageModal = ref(false);
const currentImage = ref('');

function openImage(link) {
    currentImage.value = link;
    showImageModal.value = true;
}

const showApprovalModal = ref(false);
const approvalNote = ref('');

function openApprovalModal(post) {
    postStore.openApproval(post);
    approvalNote.value = '';
    showApprovalModal.value = true;
}

function approvePost() {
    postStore.approvePost(approvalNote.value);
    showApprovalModal.value = false;
}

function rejectPost() {
    postStore.rejectPost(approvalNote.value);
    showApprovalModal.value = false;
}
</script>
