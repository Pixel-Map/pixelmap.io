import React, { useEffect } from "react";

import Head from "next/head";
import Link from "next/link";
import Layout from "../../components/Layout";
import { useForm, useFieldArray } from "react-hook-form";

function LTD() {
  const formOptions = { default: { email: "" } };

  const { register, control, handleSubmit, reset, formState, watch } =
    useForm(formOptions);
  const { errors } = formState;
  const tileWidth = watch("tileWidth");
  const tileHeight = watch("tileHeight");

  useEffect(() => {
    // update field array when ticket number changed
    const totalTiles = parseInt(tileHeight) + parseInt(tileWidth);
    const newVal = totalTiles || 0;
    const oldVal = fields.length;
    if (newVal > oldVal) {
      // append tickets to field array
      for (let i = oldVal; i < newVal; i++) {
        append({ email: "" });
      }
    } else {
      // remove tickets from field array
      for (let i = oldVal; i > newVal; i--) {
        remove(i - 1);
      }
    }
  }, [tileHeight, tileWidth]);
  const { fields, append, remove } = useFieldArray({
    name: "tickets",
    control,
  });

  function onSubmit(data) {
    // display form data on success
    alert("SUCCESS!! :-)\n\n" + JSON.stringify(data, null, 4));
  }

  return (
    <>
      <Head>
        <title>LTD Order Customization | PixelMap.io</title>
        <link
          href="//netdna.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css"
          rel="stylesheet"
        />
      </Head>
      <Layout>
        <main className="w-full max-w-5xl mx-auto mt-12 sm:mt-24 min-h-80 px-3">
          <h1 className="text-3xl font-bold mb-4 text-white">
            LTD Order Customization
          </h1>

          <div className="nes-container is-dark is-rounded">
            <div className="text-black font-medium prose max-w-none  ">
              <h3>
                <span className="text-blue-300">
                  Please fill out the form below.
                </span>
              </h3>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="card m-3">
                  <h5 className="card-header">
                    React Hook Form 7 - Dynamic Form Example
                  </h5>
                  <div className="card-body border-bottom">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Height (In Tiles)</label>
                        <select
                          name="tileHeight"
                          {...register("tileHeight")}
                          className={`form-control ${
                            errors.tileHeight ? "is-invalid" : ""
                          }`}
                        >
                          {[1, 2, 3, 4].map((i) => (
                            <option key={i} value={i}>
                              {i}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Width (In Tiles)</label>
                        <select
                          name="tileWidth"
                          {...register("tileWidth")}
                          className={`form-control ${
                            errors.tileWidth ? "is-invalid" : ""
                          }`}
                        >
                          {[1, 2, 3, 4].map((i) => (
                            <option key={i} value={i}>
                              {i}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  {Array.from({ length: tileHeight }, (_, row) => (
                    <div key={row} className="list-group list-group-flush">
                      <div className="list-group-item">
                        <div className="form-row">
                          {Array.from({ length: tileWidth }, (_, column) => (
                            <div className="form-group col-1">
                              <label>Tile #</label>
                              <input
                                name={`tickets[${row * column}]email`}
                                {...register(`tickets.${row * column}.email`)}
                                type="text"
                                className={`form-control ${
                                  errors.tickets?.[row * column]?.email
                                    ? "is-invalid"
                                    : ""
                                }`}
                              />
                              <div className="invalid-feedback">
                                {errors.tickets?.[row * column]?.email?.message}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="card-footer text-center border-top-0">
                    <button type="submit" className="btn btn-primary mr-1">
                      Buy Tickets
                    </button>
                    <button
                      onClick={() => reset()}
                      type="button"
                      className="btn btn-secondary mr-1"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </main>
      </Layout>
    </>
  );
}

export default LTD;
