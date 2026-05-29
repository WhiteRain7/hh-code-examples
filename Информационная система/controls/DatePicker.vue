<template>
    <div class="date-picker">
        <button type="button" class="button layout-horizontal" @click="visible = !visible">
            <span>{{ from(value_) }}</span>
            <Icon source="calendar" :size="24" />
        </button>

        <aside class="aside" :inert="visible ? null : 'true'">
            <Calendar :scope="scope" :value="value_" @month="handleMonth" @input="handleDay" />
        </aside>
    </div>
</template>


<script>
import { formatDate } from "~/plugins/scripts/time";

export default {
    name: "DatePicker",

    components: {
        Calendar: () => import('~/components/controls/Calendar'),
        Icon: () => import('~/components/utils/Icon'),
    },

    props: {
        /** @type {'day' | 'month'} */
        scope: {
            type: String,
            default: 'day'
        },

        value: {
            type: String,
            default: null
        }
    },

    data () {
        return {
            value_: this.value,
            visible: false
        }
    },

    watch: {
        value_ () {
            this.$emit('input', this.value_)
            this.$emit('update:modelValue', this.value_)
        },
        value () {
            this.value_ = this.value
        }
    },

    methods: {
        from (date) {
            if (!date) {
                if (this.scope === 'month') return 'ммм ГГГГ'
                else return 'дд ммм ГГГГ'
            }
            if (this.scope === 'month') return formatDate(date, 'month yyyy')
            else return formatDate(date, 'dd ofmonth yyyy')
        },

        handleMonth ({ month, year }) {
            if (this.scope === 'month') {
                this.visible = false
                this.value_ = new Date(year, month + 1).toISOString().substring(0, 7)
            }
        },

        handleDay (date) {
            if (this.scope !== 'month') {
                this.visible = false
                this.value_ = date
            }
        }
    }
}
</script>


<style scoped>
.date-picker {
    position: relative;
}

.date-picker > .button {
    width: 100%;
    height: 100%;
}

.date-picker > .aside {
    all: initial;
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    box-sizing: content-box;
    width: 240px;
    padding: 6px;
    border-radius: 10px;
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, .3);
    background: #FFF;
    font: inherit;
    transition: transform .3s, visibility .3s, opacity .3s;
}
.date-picker > .aside[inert] {
    visibility: hidden;
    transform: translateY(-20px);
    opacity: 0;
}
</style>
