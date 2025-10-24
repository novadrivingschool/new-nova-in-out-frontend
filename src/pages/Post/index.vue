<template>
    <v-container>
        <h1 class="text-h4 mb-6">Posts</h1>

        <!-- Filter -->
        <v-select v-model="localFilter" :items="filters" label="Filter by status" class="mb-4" />

        <!-- Table -->
        <v-table>
            <thead>
                <tr>
                    <th>Title</th>
                    <th>By</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Link</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="post in filteredPosts" :key="post.id">
                    <td>{{ post.title }}</td>
                    <td>{{ post.by }}</td>
                    <td>{{ post.date }}</td>
                    <td>{{ post.time }}</td>
                    <td>
                        <v-btn icon @click="openImage(post.link)">
                            <v-icon>mdi-image</v-icon>
                        </v-btn>
                    </td>
                    <td>
                        <v-chip :color="post.status === 'approved' ? 'success' : 'grey'" dark>
                            {{ post.status }}
                        </v-chip>
                    </td>
                    <td>
                        <v-btn v-if="post.status !== 'approved'" color="primary" @click="openApprovalModal(post)">
                            Approve / Reject
                        </v-btn>
                    </td>
                </tr>
            </tbody>
        </v-table>

        <!-- Image Modal -->
        <v-dialog v-model="showImageModal" max-width="600">
            <v-card>
                <v-img :src="currentImage" aspect-ratio="16/9" />
                <v-card-actions>
                    <v-spacer />
                    <v-btn text @click="showImageModal = false">Close</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Approval Modal -->
        <v-dialog v-model="showApprovalModal" max-width="500">
            <v-card>
                <v-card-title>
                    Approve or Reject Post
                </v-card-title>
                <v-card-text>
                    <v-textarea v-model="approvalNote" label="Add a note before saving" rows="3" />
                </v-card-text>
                <v-card-actions>
                    <v-btn color="success" @click="approvePost">Approve</v-btn>
                    <v-btn color="error" @click="rejectPost">Reject</v-btn>
                    <v-spacer />
                    <v-btn text @click="showApprovalModal = false">Cancel</v-btn>
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

// Local filter, initialized from the store (in case the parent redirected with a preset)
const localFilter = ref(postStore.filter);

// Computed posts filtered locally, not tied to store.filter
const filteredPosts = computed(() => {
    if (localFilter.value === 'all') return postStore.posts;
    return postStore.posts.filter(p => p.status === localFilter.value);
});

// Ensure that when the component mounts, we reset the store.filter to 'all'
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
