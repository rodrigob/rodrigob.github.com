# see http://middlemanapp.com/helpers

module DatasetHelpers

	def dataset_url(dataset)

		if dataset then
			group = dataset.group || "no_group"

			dataset.external_results_url \
			|| "#{group}_datasets_results.html##{dataset.name}" \
			|| "#"
		else
		"#"
		end
	end

end
