<template>
    <div class="form-field-slider" :class="{ [field.orientation ?? 'horizontal']: true }">
        <input
            :id="uuid + '-field-' + field.type"
            class="form-field-slider-input"
            type="range"
            :orient="field.orientation"
            min="0"
            :max="Object.keys(field.options).length - 1"
            v-model="value"
            :list="uuid + '-datalist'"
            :title="field.placeholder"
            @wheel="value = Math.min(Math.max(Number(value + ($event.deltaY > 0 ? -1 : 1)), 0), Object.keys(field.options).length - 1)"/>

        <datalist :id="uuid + '-datalist'" :class="{ 'form-field-datalist': !field.multiline }">
            <option
                v-for="(option, key) in field.options"
                :key="key"
                :value="key"
                :label="option?.name ?? option"
                class="form-field-datalist-option"
                :class="{ selected: value == key }"
                @click="value = key">
            </option>
        </datalist>

        <ol v-if="field.multiline" class="form-field-datalist">
            <li
                v-for="(option, key) in field.options"
                :key="key"
                class="form-field-datalist-option"
                :class="{ selected: value == key }"
                @click="value = key">

                {{ option.name ?? option }}
            </li>
        </ol>
    </div>
</template>


<script>
/**
 * returns some of (based on `field.expect`):
 * - `number`
 * - `object`
 * - `{ key: number, value: object }`
 *
 * @typedef {Object} field
 *
 * @property {'checkbox'} type
 * @property {Array<any> | Record<string, any>} options
 * @property {string} [placeholder] - low support; title of slider
 * @property {boolean} [multiline=false] - allow multiline labels
 * @property {'vertical' | 'horizontal'} [orientation='horizontal'] - orientation of slider
 * @property {'key' | 'value' | 'all'} [expect='value']
 */

export default {
    name: 'FormFieldSlider',

    props: {
        /** @type {() => field} */
        field: Object,
        uuid: String
    },

    components: {
        Dropdown: () => import('~/components/controls/Dropdown.vue'),
    },

    data () {
        return {
            value: this.$parent.resolveInitial()?.key,
        }
    },

    watch: {
        value () { this.$parent.isValid() }
    },

    methods: {
        clear () { this.value = this.$parent.resolveInitial()?.key },
        collectInitial () {
            let ini = this.$parent.resolveInitial()

            switch (this.field.expect) {
                case 'key': return ini?.key
                case 'all': return ini
                case 'value':
                default: return ini?.value
            }
        },
        collect () {
            switch (this.field.expect) {
                case 'key': return this.value
                case 'all': return { key: this.value, value: this.field.options[this.value] }
                case 'value':
                default: return this.field.options[this.value]
            }
        },

        isEmpty () { return this.value == null },
        onEmpty: () => 'Должно быть выбрано значение'
    }
}
</script>


<style scoped>
.form-field-select :deep(li) {
    text-align: left;
}

.form-field-slider-input {
    width: 100%;
    accent-color: #0089d6;
}

.form-field-datalist {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
    width: 100%;
    user-select: none;
    list-style: none;
}

    .form-field-datalist-option {
        flex: 2;
        width: 50px;
        border-radius: 6px;
        background: #FFF;
        text-align: center;
        overflow: hidden;
        text-overflow: ellipsis;
        opacity: .5;
        transition: .3s;
        cursor: pointer;
        position: relative;
    }

    .form-field-datalist-option:first-child {
        flex: 1;
        text-align: left;
        direction: ltr;
    }
    .form-field-datalist-option:last-child {
        flex: 1;
        text-align: right;
        direction: rtl;
    }

    .form-field-datalist:hover > .form-field-datalist-option {
        opacity: 1;
    }
    .form-field-datalist-option:hover {
        text-shadow: 0 0 4px #888;
        overflow: visible;
        z-index: 2;
    }

    .form-field-datalist-option.selected {
        color: #0089d6;
        font-weight: bold;
        opacity: 1;
        overflow: visible;
        z-index: 1;
    }


.form-field-slider.vertical {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: stretch;
    gap: 4px;
    width: 100%;
    height: auto;
}
.form-field-slider.vertical > .form-field-slider-input {
    appearance: slider-vertical;
    writing-mode: vertical-lr;
    width: 40px;
}
.form-field-slider.vertical > .form-field-datalist {
    flex: 1;
    flex-direction: column-reverse;
}
.form-field-slider.vertical > .form-field-datalist > .form-field-datalist-option {
    width: auto;
    text-align: left;
    direction: ltr;
    overflow: initial;
}
</style>
