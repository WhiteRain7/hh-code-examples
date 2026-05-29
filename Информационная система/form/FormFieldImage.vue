<template>
    <div>
        <MediaEditable
            :id="uuid + '-field-' + field.type"
            :readonly="field.readonly"
            v-model="value"
            @change="$parent.isValid()"
            :accepts="[ 'image' ]" />
    </div>
</template>


<script>
/**
 * @typedef {Object} File
 * @property {string} id
 * @property {string} path
 * @property {string} name
 * @property {string} type
 * @property {number} size - in bytes
 */

/**
 * returns {@link File}
 *
 * @typedef {Object} field
 *
 * @property {'image'} type
 * @property {boolean} [required=false]
 * @property {boolean} [readonly]
 * @property {File} [initial]
 */

export default {
    name: 'FormFieldImage',

    components: {
        MediaEditable: () => import('~/components/media/MediaEditable')
    },

    props: {
        /** @type {() => field} */
        field: Object,
        uuid: String
    },

    data () {
        return {
            value: this.field.initial || null
        }
    },

    methods: {
        clear () { this.value = this.field.initial || null },
        collectInitial () { return this.field.initial },
        collect () { return this.value },

        isValid () { return true },
        isEmpty () { return !this.value },
        onEmpty: () => 'Вы должны загрузить изображение'
    }
}
</script>


<style scoped>

</style>
