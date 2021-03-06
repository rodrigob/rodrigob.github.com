import "dart:html";

// Drag and drop aspect based on
// https://www.dartlang.org/samples/dndfiles/

//export 'package:polymer/init.dart';

import 'package:angular/angular.dart';

import 'package:di/di.dart';
import 'package:angular/application_factory_static.dart';
import 'package:logging/logging.dart';

import 'dart:convert' show HtmlEscape;
import 'dart:typed_data';
import 'dart:js';

import 'dart:async';
import 'boundaries_estimation_dart_static_expressions.dart' as generated_static_expressions;
import 'boundaries_estimation_dart_static_metadata.dart' as generated_static_metadata;
import 'boundaries_estimation_dart_static_injector.dart' as generated_static_injector;

final bool start_from_javascript = false;

// This method will modify the provided image
void boundaries_estimation(final CanvasElement canvas, {final bool use_sobel:
    false}) {
  // Part of this code based on
  // http://kapadia.github.io/emscripten/2013/09/13/emscripten-pointers-and-pointers.html

  // ImageData is assumed RGBA
  final ImageData image_data = canvas.context2D.getImageData(0, 0, canvas.width,
      canvas.height);

  final int width = image_data.width,
      height = image_data.height;


  final Uint8List uint8_data_view = new Uint8List.view((image_data.data as
      Uint8ClampedList).buffer);

  final JsObject uint8_data_js = new JsArray.from(uint8_data_view);
  final int num_bytes_to_allocate = uint8_data_view.length *
      uint8_data_view.elementSizeInBytes;
  assert(num_bytes_to_allocate == (4 * width * height));
  final JsObject emcc_module = context["Module"];
  assert(emcc_module != null);

  final int buffer_ptr = emcc_module.callMethod("_malloc",
      [num_bytes_to_allocate]);
  final Uint8List heapu8 = emcc_module["HEAPU8"];
  if (heapu8 == null) {
    print("heapu8 is null, nooo !");
  }

  // copy our data into the heap (js_buffer)
  heapu8.setAll(buffer_ptr, uint8_data_view);
  final Uint8List js_buffer_view = new Uint8List.view(heapu8.buffer, buffer_ptr,
      num_bytes_to_allocate);

  String method_to_call = "compute_boundaries_structured_forest";
  if (use_sobel) {
    method_to_call = "compute_boundaries_sobel";
  }
  print("Calling ${method_to_call}");
  emcc_module.callMethod("ccall", [method_to_call, "void", new JsArray.from(
      ["number", "number", "number"]), new JsArray.from([buffer_ptr, width, height])]
      );
  print("Boundaries computed.");

  // we copy the result back into the image_data
  uint8_data_view.setAll(0, js_buffer_view);

  canvas.context2D.putImageData(image_data, 0, 0);
  print("Canvas updated");

  emcc_module.callMethod("_free", [buffer_ptr]);
  return;
}


@Controller(selector: "[boundaries_estimation]", publishAs: "ctrl")
class BoundariesEstimationController {

  final ImageElement img = querySelector("#input_image");
  final ImageElement loading_gif = querySelector("#loading");
  final DivElement boundaries_image_container = querySelector(
      "#boundaries_image_container");
  final CanvasElement boundaries_canvas = querySelector(
      "#boundaries_image_canvas");

  final Element drop_zone_one = querySelector('#drop-zone');
  final Element drop_zone_two = querySelector('#sketch');
  final FormElement file_form = querySelector('#read');
  final InputElement file_input = querySelector('#upload_input');
  final OutputElement output = querySelector('#list');
  final OutputElement computation_log = querySelector('#computation_log');
  final HtmlEscape sanitizer = new HtmlEscape();

  final ButtonElement button_sb = querySelector("#sb_button"),
      button_sf = querySelector("#sf_button");

  ImageData sb_cache = null,
      sf_cache = null;

  BoundariesEstimationController() {
    assert(img != null);
    assert(boundaries_canvas != null);

    update_images_sizes();
    attach_emscripten_log();

    file_input.onChange.listen((e) => on_file_input_change());

    drop_zone_one.onDragOver.listen(on_drag_over);
    drop_zone_one.onDragEnter.listen((e) => drop_zone_one.classes.add('hover'));
    drop_zone_one.onDragLeave.listen((e) => drop_zone_one.classes.remove('hover'
        ));
    drop_zone_one.onDrop.listen(on_drop);

    drop_zone_two.onDragOver.listen(on_drag_over);
    drop_zone_two.onDragEnter.listen((e) => drop_zone_two.classes.add('hover'));
    drop_zone_two.onDragLeave.listen((e) => drop_zone_two.classes.remove('hover'
        ));
    drop_zone_two.onDrop.listen(on_drop);

    if (start_from_javascript) {
      javascript_loading_finished();
    } else {

      final JsObject emscripten_module = context["Module"];

      // we check every 10 milliseconds if Module.calledRun as been set
      Future wait_for_emscripten() {
        return new Future.delayed(const Duration(milliseconds: 10), () {

          if (emscripten_module["calledRun"] == true) {
            javascript_loading_finished();
          } else {
            wait_for_emscripten();
          }
        });
      }

      wait_for_emscripten();
    }

    return;
  }

  void javascript_loading_finished() {

    loading_gif.hidden = true;
    button_sb.attributes.remove("disabled");
    button_sf.attributes.remove("disabled");

    log_success("Javascript code loaded.");

    return;
  }

  void log_message(final String message, {final String paragraph_class:
      "bg-info"}) {
    final ParagraphElement p = new ParagraphElement();
    p.classes.add(paragraph_class);
    p.innerHtml = message;
    computation_log.nodes.insert(0, p);

    print(message); // echo to the console
    return;
  }

  void log_info(final String message) {
    log_message(message, paragraph_class: "bg-info");
    return;
  }

  void log_warning(final String message) {
    log_message(message, paragraph_class: "bg-warning");
    return;
  }


  void log_success(final String message) {
    log_message(message, paragraph_class: "bg-success");
    return;
  }

  void log_danger(final String message) {
    log_message(message, paragraph_class: "bg-danger");
    return;
  }


  void attach_emscripten_log() {
    final JsObject emcc_module = context["Module"];
    assert(emcc_module != null);

    emcc_module["print"] = log_info;
    emcc_module["printErr"] = log_warning;

    return;
  }

  void update_images_sizes() {

    // new image has been set, we clean the cache
    sb_cache = null;
    sf_cache = null;

    final double aspect_ratio = img.width.toDouble() / img.height;
    final int max_width = 500,
        max_height = 500;

    if (img.width > max_width) {
      img.width = max_width;
      img.height = max_width ~/ aspect_ratio;
    }

    if (img.height > max_height) {
      img.width = (max_height * aspect_ratio).toInt();
      img.height = max_height;
    }

    loading_gif.style.position = "absolute";
    loading_gif.width = (img.width * 0.20).toInt();
    final String left_margin = ((img.width - loading_gif.width) ~/ 2).toString()
        + "px",
        top_margin = ((img.height - loading_gif.height) ~/ 2).toString() + "px";
    loading_gif.style.marginLeft = left_margin;
    loading_gif.style.marginTop = top_margin;

    boundaries_canvas.width = img.width;
    boundaries_canvas.height = img.height;

    boundaries_image_container.style.width = img.width.toString() + "px";
    return;
  }


  void on_drag_over(MouseEvent event) {
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }


  void on_drop(MouseEvent event) {
    event.stopPropagation();
    event.preventDefault();
    drop_zone_one.classes.remove('hover');
    drop_zone_two.classes.remove('hover');
    file_form.reset();
    on_files_selected(event.dataTransfer.files);
  }


  void on_file_input_change() {
    on_files_selected(file_input.files);
  }


  void on_files_selected(final List<File> files) {
    output.nodes.clear();
    var list = new UListElement();
    for (var file in files) {
      var item = new LIElement();

      // If the file is an image, read and display its thumbnail.
      if (file.type.startsWith('image')) {
        var thumbHolder = new SpanElement();
        var reader = new FileReader();
        reader.onLoad.listen((e) {
          final ImageElement thumbnail = new ImageElement(src: reader.result);

          thumbnail.classes.add('thumb');
          thumbnail.title = sanitizer.convert(file.name);
          thumbHolder.nodes.add(thumbnail);

          // trick to get in image in Firefox
          final ImageElement image_size_trick = new ImageElement(src:
              reader.result);
          image_size_trick.style.display = "none";
          document.body.append(image_size_trick);
          final int image_width = image_size_trick.width,
              image_height = image_size_trick.height;

          // we propagate the new content, and new image size
          img.src = thumbnail.src;
          img.width = image_width;
          img.height = image_height;
          update_images_sizes();
        });
        reader.readAsDataUrl(file);
        item.nodes.add(thumbHolder);
      }

      // For all file types, display some properties.
      var properties = new Element.tag('span');
      properties.innerHtml = (new StringBuffer('<strong>')
          ..write(sanitizer.convert(file.name))
          ..write('</strong> (')
          ..write(file.type != null ? sanitizer.convert(file.type) : 'n/a')
          ..write(') ')
          ..write(file.size)
          ..write(' bytes')
          ..write(', last modified: ')
          ..write(file.lastModifiedDate != null ? file.lastModifiedDate.toLocal(
              ).toString() : 'n/a')).toString();
      item.nodes.add(properties);
      list.nodes.add(item);
    }
    output.nodes.add(list);
  }


  void compute_the_boundaries({final bool use_sobel: false}) {

    loading_gif.hidden = false;
    final ctx = boundaries_canvas.context2D;
    ctx.drawImageScaled(img, 0, 0, boundaries_canvas.width,
        boundaries_canvas.height);

    ImageData cached_result = null;
    String method_name = "";
    if (use_sobel) {
      cached_result = sb_cache;
      method_name = "Sobel";
    } else {
      cached_result = sf_cache;
      method_name = "Structured Forest";
    }

    if (cached_result != null) { // we use cache
      ctx.putImageData(cached_result, 0, 0);
      log_success("Showing cached $method_name result");
      loading_gif.hidden = true;
    } else { // we launch the computation

      // animationFrame is a trick to make sure the log message appears,
      // before boundaries_estimation freezes the user interface
      window.animationFrame.then((final num time) {
        log_warning("Launching computation (will take a few seconds)");
        window.animationFrame.then((final num time) {

          boundaries_estimation(boundaries_canvas, use_sobel: use_sobel);

          window.animationFrame.then((final num time) {
            final ImageData image_data = ctx.getImageData(0, 0,
                boundaries_canvas.width, boundaries_canvas.height);

            if (use_sobel) {
              sb_cache = image_data;
            } else {
              sf_cache = image_data;
            }

            log_success("Boundaries computed.");
            loading_gif.hidden = true;
          });
        });
      });

    }
    return;
  }


} // end of class BoundariesEstimationController


class BoundariesEstimationModule extends Module {
  BoundariesEstimationModule() {
    bind(BoundariesEstimationController);
  }
}


void dart_main() {

  Logger.root.level = Level.FINEST; // Level.FINEST Level.INFO Level.OFF
  Logger.root.onRecord.listen((LogRecord r) {
    print(r.message);
  });

  staticApplicationFactory(generated_static_injector.factories, generated_static_metadata.typeAnnotations, generated_static_expressions.getters, generated_static_expressions.setters, generated_static_expressions.symbols).addModule(new BoundariesEstimationModule()).run();

  return;
}

void main() {

  if (start_from_javascript) {
    // we expose our entry function to javascript
    context["dart_main"] = dart_main;
    // (and now we wait for it to be called)
  } else {
    dart_main();
  }

}
