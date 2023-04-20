<script lang="ts">
	import { modelStore } from '../stores/model'
	import { record as recordStore, handleSubmit } from '../stores/record'
	import LoadingButton from './LoadingButton.svelte'

	export let model: CozJSONSchema
	export let record: any = {}
	export let onSubmit: RecordSubmitFunction
	export let onCancel: () => void

	$: modelStore.set(model)
	$: recordStore.set(record)
</script>

<div class="card w-min bg-slate-200 p-8">
	<h2 class="font-bold text-xl text-primary capitalize">title</h2>
	<div class="card-body flex flex-col gap-4 rounded-lg">
		{#each Object.entries($modelStore.properties || {}) as [key, value]}
			<div>
				<label for={key} class="label">{value.title || key}</label>
				<input type="text" class="input input-bordered" name={key} bind:value={$recordStore[key]} />
			</div>
		{/each}
	</div>
	<div class="card-actions">
		<LoadingButton
			action={async () => {
				await handleSubmit(onSubmit)
			}}>Submit</LoadingButton
		>
		<button on:click={onCancel} class="btn btn-warning">Cancel</button>
	</div>
</div>
