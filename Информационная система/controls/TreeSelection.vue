<template>
    <ul>
        <TreeElement v-for="element, index in elements" :key="index" :element="element" @change="$emit('change', $event)" />
    </ul>
</template>


<script>
    export default {
        name: "TreeSelection",

        props: [ 'elements' ],

        components: {
            TreeElement: () => import('~/components/controls/TreeElement.vue')
        },

        methods: {
            getCustomCheckedList (tree, list = []) {
                if (!tree?.length) return

                for (const element of tree) {
                    if (element.checked) list.push(element)
                    if (element.sub?.length) list = this.getCustomCheckedList(element.sub, list)
                }

                return list
            },

            getCheckedList () {
                return this.getCustomCheckedList(this.elements)
            }
        }
    }
</script>
