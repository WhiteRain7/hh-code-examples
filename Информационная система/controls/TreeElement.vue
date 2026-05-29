<template>
    <li
        class="tree-element"
        :class="{ checked: element.checked, disabled: element.disabled, collapsed: collapsed }"
        :title="element.disabled ? element.disabled_reason : ''">

        <section class="tree-element-content">
            <div
                v-if="!element.readonly"
                class="tree-element-checkbox-container"
                role="checkbox"
                :aria-checked="element.checked">

                <input type="checkbox" class="tree-element-checker" v-model="element.checked" @change="$emit('change', element)" />
                <div class="tree-element-checkbox"></div>
            </div>

            <button
                class="tree-element-representation"
                @click="collapsed = (element.sub?.length ? !collapsed : false)">

                <p class="tree-element-name" :title="element.name">{{ element.name }}</p>
                <p v-if="element.subname" class="tree-element-subname" :title="element.subname">{{ element.subname }}</p>
            </button>
        </section>

        <ul v-if="element.sub?.length && !collapsed" class="tree-element-list">
            <TreeElement v-for="element, index in element.sub" :key="index" :element="element" @change="$emit('change', $event)" />
        </ul>
    </li>
</template>


<script>
    export default {
        name: "TreeElement",

        props: [ 'element' ],
        /** {
         *      name: string,
         *      subname?: string,
         *      sub?: [ element, ... ],
         *      checked?: boolean,
         *      readonly?: boolean,
         *      disabled?: boolean,
         *      disabled_reason?: string
         *  }
         */

        components: {
            TreeElement: () => import('~/components/controls/TreeElement.vue')
        },

        data: function () {
            return {
                collapsed: false
            }
        },
    }
</script>


<style scoped>
    .tree-element {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        justify-content: flex-start;
        align-items: flex-start;
        gap: 10px;
        margin-bottom: 8px;
    }

    .tree-element-content {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        justify-content: flex-start;
        align-items: center;
        gap: 10px;
        box-sizing: border-box;
        width: 300px;
        min-height: 60px;
        padding: 10px;
        border-radius: 10px;
        background: #FFF;
        color: #000;
        box-shadow: 0 1px 4px 0 #888;
        position: relative;
        z-index: 15;
    }

    .tree-element.checked > .tree-element-content {
        background: #F5F9FF;
    }

    .tree-element.disabled > .tree-element-content {
        opacity: .5;
        pointer-events: none;
    }

    .tree-element.collapsed > .tree-element-content {
        background: #F9F9F9;
    }
    .tree-element.collapsed > .tree-element-content::after {
        content: 'скрыто';
        display: flex;
        justify-content: center;
        align-items: center;
        position: absolute;
        top: 50%;
        left: calc(100% + 10px);
        transform: translateY(-50%);
        height: 24px;
        padding: 0 6px;
        border-radius: 666px;
        background: #888;
        color: #EEE;
    }

    .tree-element :deep(.tree-element > .tree-element-content::before) {
        content: '';
        position: absolute;
        top: 50%;
        right: 100%;
        transform: translateY(-50%);
        width: 10px;
        height: 4px;
        border-radius: 666px;
        background: #888;
    }

    .tree-element-checkbox-container {
        box-sizing: border-box;
        width: 40px;
        min-width: 40px;
        max-width: 40px;
        height: 80%;
        padding: 6px;
        border-right: 1px solid #EEE;
        cursor: pointer;
        position: relative;
    }

    .tree-element-checker {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        opacity: 0;
        cursor: pointer;
        z-index: 3;
    }

    .tree-element-checkbox {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        border: 1px solid #888;
        border-radius: 8px;
        background: #F5F5F5;
        transition: .25s;
        cursor: pointer;
        z-index: 1;
    }

    .tree-element-checker:hover + .tree-element-checkbox {
        background: #DDD;
    }
    .tree-element-checker:active + .tree-element-checkbox,
    .tree-element-checker:checked + .tree-element-checkbox {
        background: #0089d6;
        border-color: #0089d6;
    }

    .tree-element-checker:checked + .tree-element-checkbox::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: 100%;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="32" viewBox="0 -960 960 960" width="32" fill="%23FFFFFF"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>');
        background-position: center;
        background-repeat: no-repeat;
        z-index: 2;
    }

    .tree-element-representation {
        display: block;
        flex: 1;
        height: 100%;
        text-align: left;
        overflow: hidden;
    }

    .tree-element-name {
        display: block;
        width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 16px;
        font-weight: bold;
    }
    .tree-element-subname {
        display: block;
        width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: #888;
        font-size: 14px;
    }

    .tree-element-list {
        position: relative;
    }

    .tree-element > .tree-element-list::before {
        content: '';
        position: absolute;
        top: 28px;
        bottom: 36px;
        right: calc(100% + 8px);
        width: 4px;
        border-radius: 666px;
        background: #888;
        z-index: 0;
    }
</style>
