<template>
    <div>
        <input
            :id="uuid + '-field-' + field?.type"
            class="admin-input"
            type="time"
            v-model="value"
            :min="field.min"
            :max="field.max"
            :step="field.step"
            :title="field.placeholder"
            @input="$parent.isValid()" />
    </div>
</template>

<script>
/**
 * returns {@link string} like 'hh:mm'
 *
 * @typedef {Object} field
 *
 * @property {'time'} type
 * @property {string} [initial]
 * @property {string} [min='00:00']
 * @property {string} [max='23:59']
 * @property {number | string} [step='60']
 * @property {string} [placeholder]
 */

export default {
    name: 'FormFieldTime',

    props: {
        /** @type {() => field} */
        field: Object,
        uuid: String
    },

    data() {
        return {
            value: this.setInitialTime() || "",
            min: this.field.min || '00:00',
            max: this.field.max || '23:59',
            step: this.field.step || '60',
        };
    },

    methods: {
        clear () { this.value = this.setInitialTime() || null },
        collectInitial () { return this.setInitialTime() },
        collect () { return this.value },

        isValid () {
            if (this.min && this.value < this.min) {
                return `Время должно быть позднее или равно ${this.min}`
            }

            if (this.max && this.value > this.max) {
                return `Время должно быть раньше или равно ${this.max}`
            }

            return true
        },
        isEmpty () { return !this.value },
        onEmpty: () => 'Вы должны указать время',
        setInitialTime() {
            if (this.field.initial instanceof Date) {
                return this.value = this.field.initial.getHours() + ":" + this.field.initial.getMinutes()
            } else if ( typeof this.field.initial === "string" ) {
                var H, M
                let hours =  this.field.initial.split(':')[0]
                if (hours < 10) H = '0' + hours
                let minutes =  this.field.initial.split(':')[1]
                if (minutes < 10) M = '0' + minutes
                return this.value = (H || hours) + ':' + (M || minutes)
            }
        }
    },

  };
</script>


<style>
    .mx-datepicker {
        width: 100%;
    }

    .mx-input {
        width: 100%;
        padding: 10px;
        border: 1px solid var(--colour-admin-controls-border);
        border-radius: 4px;
        background-color: var(--colour-admin-controls-back);
        color: var(--colour-admin-controls-front);
        font-size: 16px;
    }

</style>
